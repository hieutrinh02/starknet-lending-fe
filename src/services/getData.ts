import { byteArray, CallData, Contract } from "starknet";
import {
    HF_DISPLAY_SCALE,
    MARKET_CONTRACT,
    MAX_LTV_DENOMINATOR,
    MAX_LTV_NUMERATOR,
    PERCENTAGE_DECIMALS,
    PRICE_DECIMALS,
    provider,
    SECS_IN_YEAR,
    TX_DELAY_SECS,
} from "@/constants";
import { formatScaledDecimal } from "@/utils";
import MockTokenABI from "@/abi/MockToken.json";

type IndexedPool = {
    poolAddress: string;
    tokenAddress: string;
    collateralTokenAddress: string;
    discoveredInBlock: number;
    txHash: string;
    createdAt: number;
    updatedAt: number;
};

type BorrowQuantity = {
    borrowQuantity: bigint;
    borrower: string;
    poolAddress: string;
};

type BorrowIdCacheEntry = {
    borrower: string;
    poolAddress: string;
    poolName: string;
    borrowId: string;
};

type PoolRegistryEntry = IndexedPool & {
    poolName: string;
    tokenSymbol: string;
    collateralTokenSymbol: string;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const tokenSymbolCache = new Map<string, string>();

const callContractLatest = (call: {
    contractAddress: string;
    entrypoint: string;
    calldata?: ReturnType<typeof CallData.compile>;
}) => provider.callContract(call, "latest");

function calculateInterest(
    borrowAmount: bigint,
    borrowApr: bigint,
    borrowStartTime: bigint,
    currentUnixTimestamp: number
): bigint {
    const elapsedSeconds = BigInt(
        Math.max(currentUnixTimestamp + TX_DELAY_SECS - Number(borrowStartTime), 0)
    );

    return (
        borrowAmount *
        borrowApr *
        elapsedSeconds /
        BigInt(PERCENTAGE_DECIMALS) /
        BigInt(PERCENTAGE_DECIMALS) /
        BigInt(SECS_IN_YEAR)
    );
}

function calculateHealthFactor(
    collateralAmount: bigint,
    borrowAmount: bigint,
    interest: bigint,
    collateralPriceInUSD: bigint,
    tokenPriceInUSD: bigint
): string {
    const totalDebt = borrowAmount + interest;

    if (
        totalDebt === BigInt(0) ||
        tokenPriceInUSD === BigInt(0) ||
        collateralPriceInUSD === BigInt(0)
    ) {
        return "0";
    }

    const hfScaled =
        collateralAmount *
        collateralPriceInUSD *
        MAX_LTV_NUMERATOR *
        HF_DISPLAY_SCALE /
        totalDebt /
        tokenPriceInUSD /
        MAX_LTV_DENOMINATOR;

    return formatScaledDecimal(hfScaled, HF_DISPLAY_SCALE, {
        trimTrailingZeros: true,
    });
}

function getPoolInfoNumericOffset(response: string[]): number | null {
    if (!response.length) {
        return null;
    }

    const byteArrayWordCount = Number(response[0]);
    if (Number.isNaN(byteArrayWordCount) || byteArrayWordCount < 0) {
        return null;
    }

    return 3 + byteArrayWordCount;
}

async function getTokenSymbol(tokenAddress: string): Promise<string> {
    const normalizedAddress = tokenAddress.toLowerCase();
    const cachedSymbol = tokenSymbolCache.get(normalizedAddress);
    if (cachedSymbol) {
        return cachedSymbol;
    }

    try {
        const tokenContract = new Contract(MockTokenABI, tokenAddress, provider);
        const rawSymbol = await tokenContract.call("symbol", [], {
            blockIdentifier: "latest",
        });
        const symbol =
            typeof rawSymbol === "string"
                ? rawSymbol
                : byteArray.stringFromByteArray(rawSymbol as any);
        const normalizedSymbol = symbol.trim();

        if (!normalizedSymbol) {
            throw new Error(`Empty symbol for token ${tokenAddress}`);
        }

        tokenSymbolCache.set(normalizedAddress, normalizedSymbol);
        return normalizedSymbol;
    } catch (error) {
        throw new Error(
            `Failed to fetch token symbol for ${tokenAddress}: ${error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}

async function fetchIndexedPools(): Promise<IndexedPool[]> {
    const response = await fetch("/api/pools", { cache: "no-store" });
    if (!response.ok) {
        throw new Error("Failed to fetch pools from indexer");
    }

    const payload = (await response.json()) as
        | { data?: IndexedPool[] }
        | IndexedPool[];
    return Array.isArray(payload) ? payload : payload.data ?? [];
}

export async function fetchPoolRegistry(): Promise<PoolRegistryEntry[]> {
    const pools = await fetchIndexedPools();
    const uniqueTokenAddresses = Array.from(
        new Set(
            pools.flatMap((pool) => [pool.tokenAddress, pool.collateralTokenAddress])
        )
    );
    const symbols = await Promise.all(
        uniqueTokenAddresses.map((tokenAddress) => getTokenSymbol(tokenAddress))
    );
    const symbolByAddress = new Map(
        uniqueTokenAddresses.map((tokenAddress, index) => [
            tokenAddress.toLowerCase(),
            symbols[index],
        ])
    );

    return pools.map((pool) => ({
        ...pool,
        tokenSymbol:
            symbolByAddress.get(pool.tokenAddress.toLowerCase()) ??
            (() => {
                throw new Error(
                    `Missing token symbol for address ${pool.tokenAddress}`
                );
            })(),
        collateralTokenSymbol:
            symbolByAddress.get(pool.collateralTokenAddress.toLowerCase()) ??
            (() => {
                throw new Error(
                    `Missing collateral token symbol for address ${pool.collateralTokenAddress}`
                );
            })(),
        poolName: `${symbolByAddress.get(pool.tokenAddress.toLowerCase())}/${symbolByAddress.get(
            pool.collateralTokenAddress.toLowerCase()
        )}`,
    }));
}

async function fetchTokenPrice(tokenAddress: string): Promise<bigint> {
    const response = await callContractLatest({
        contractAddress: MARKET_CONTRACT,
        entrypoint: "get_price_usd",
        calldata: CallData.compile({
            token: tokenAddress,
        }),
    });

    if (!response || response.length < 2) {
        return BigInt(0);
    }

    const rawPrice = BigInt(response[0]);
    const priceDecimals = Number(response[1]);
    const targetDecimals = 8;

    if (priceDecimals === targetDecimals) {
        return rawPrice;
    }

    if (priceDecimals > targetDecimals) {
        return rawPrice / BigInt(10 ** (priceDecimals - targetDecimals));
    }

    return rawPrice * BigInt(10 ** (targetDecimals - priceDecimals));
}

export const fetchLatestTokenPricesData = async (
    pools: PoolRegistryEntry[],
    setTokenPrices: (prices: Record<string, bigint>) => void
) => {
    const uniqueTokenAddresses = Array.from(
        new Set(
            pools.flatMap((pool) => [pool.tokenAddress, pool.collateralTokenAddress])
        )
    );

    try {
        const priceResponses = await Promise.all(
            uniqueTokenAddresses.map((tokenAddress) => fetchTokenPrice(tokenAddress))
        );

        const tokenPriceMap: Record<string, bigint> = {};
        uniqueTokenAddresses.forEach((tokenAddress, index) => {
            const price = priceResponses[index] ?? BigInt(0);
            const normalizedAddress = tokenAddress.toLowerCase();

            tokenPriceMap[normalizedAddress] = price;
        });

        setTokenPrices(tokenPriceMap);
    } catch (error) {
        console.error("Error fetching token prices:", error);
        throw error;
    }
};

export const fetchLatestPoolInfoData = async (
    pools: PoolRegistryEntry[],
    tokenPrices: Record<string, bigint>,
    setMarketData: (data: any[]) => void
) => {
    const poolDataRequests = pools.map((pool) =>
        callContractLatest({
            contractAddress: pool.poolAddress,
            entrypoint: "get_pool_info",
        })
    );

    try {
        const poolDataResponses = await Promise.all(poolDataRequests);

        const marketData = poolDataResponses.map((response: any, index) => {
            const pool = pools[index];
            const priceInUSD =
                tokenPrices[pool.tokenAddress.toLowerCase()] ?? BigInt(0);
            const poolName = pool.poolName;
            const numericOffset = Array.isArray(response)
                ? getPoolInfoNumericOffset(response)
                : null;

            if (
                !response ||
                numericOffset === null ||
                response.length !== numericOffset + 10 ||
                priceInUSD === BigInt(0)
            ) {
                console.error(`Unexpected response for pool ${poolName}:`, response);
                return {
                    pool: poolName,
                    totalBorrowInUSD: "Error",
                    totalSupplyInUSD: "Error",
                    totalBorrow: "Error",
                    totalSupply: "Error",
                    ur: "Error",
                    borrowAPR: "Error",
                    supplyAPY: "Error",
                };
            }

            const totalBorrowInUSD = (
                (BigInt(response[numericOffset + 0]) * priceInUSD) /
                PRICE_DECIMALS
            ).toString();
            const totalSupplyInUSD = (
                (BigInt(response[numericOffset + 2]) * priceInUSD) /
                PRICE_DECIMALS
            ).toString();
            const totalBorrow = BigInt(response[numericOffset + 0]).toString();
            const totalSupply = BigInt(response[numericOffset + 2]).toString();
            const ur = BigInt(response[numericOffset + 4]).toString();
            const borrowAPR = BigInt(response[numericOffset + 6]).toString();
            const supplyAPY = BigInt(response[numericOffset + 8]).toString();

            return {
                pool: poolName,
                poolAddress: pool.poolAddress,
                tokenAddress: pool.tokenAddress,
                collateralTokenAddress: pool.collateralTokenAddress,
                totalBorrowInUSD,
                totalSupplyInUSD,
                totalBorrow,
                totalSupply,
                ur,
                borrowAPR,
                supplyAPY,
            };
        });

        setMarketData(marketData);
    } catch (error) {
        console.error("Error fetching pool info data:", error);
        throw error;
    }
};

export const fetchLatestUserSupplyData = async (
    pools: PoolRegistryEntry[],
    userAddress: string,
    setUserSupplyData: (data: any[]) => void
) => {
    const userLpOwnedDataRequests = pools.map((pool) =>
        callContractLatest({
            contractAddress: pool.poolAddress,
            entrypoint: "get_user_to_lp_owned",
            calldata: CallData.compile([userAddress]),
        })
    );
    const tokenTotalSupplyDataRequests = pools.map((pool) =>
        callContractLatest({
            contractAddress: pool.poolAddress,
            entrypoint: "get_total_supply",
        })
    );
    const supplyAPYDataRequests = pools.map((pool) =>
        callContractLatest({
            contractAddress: pool.poolAddress,
            entrypoint: "calculate_supply_apy",
        })
    );
    const lpTokenAddressRequests = pools.map((pool) =>
        callContractLatest({
            contractAddress: pool.poolAddress,
            entrypoint: "get_lp_token_address",
        })
    );

    try {
        const [
            userLpOwnedDataResponses,
            tokenTotalSupplyDataResponses,
            supplyAPYDataResponses,
            lpTokenAddressResponses,
        ] = await Promise.all([
            Promise.all(userLpOwnedDataRequests),
            Promise.all(tokenTotalSupplyDataRequests),
            Promise.all(supplyAPYDataRequests),
            Promise.all(lpTokenAddressRequests),
        ]);

        const lpTokenAddresses = lpTokenAddressResponses.map((response: any, index) => {
            const poolName = pools[index].poolName;

            if (!response || response.length !== 1) {
                console.error(
                    `Unexpected lp token address response for pool ${poolName}:`,
                    response
                );
                return null;
            }

            return response[0];
        });

        const lpTokenTotalSupplyDataResponses = await Promise.all(
            lpTokenAddresses.map((address) =>
                address
                    ? callContractLatest({
                        contractAddress: address,
                        entrypoint: "total_supply",
                    })
                    : Promise.resolve(null)
            )
        );

        const tokenTotalSupplyData = tokenTotalSupplyDataResponses.map(
            (response: any, index) => {
                const poolName = pools[index].poolName;

                if (!response || response.length !== 2) {
                    console.error(
                        `Unexpected token total supply response for pool ${poolName}:`,
                        response
                    );
                    return BigInt(0);
                }

                return BigInt(response[0]);
            }
        );

        const supplyAPYData = supplyAPYDataResponses.map((response: any, index) => {
            const poolName = pools[index].poolName;

            if (!response || response.length !== 2) {
                console.error(
                    `Unexpected supply apy response for pool ${poolName}:`,
                    response
                );
                return BigInt(0);
            }

            return BigInt(response[0]);
        });

        const lpTokenTotalSupplyData = lpTokenTotalSupplyDataResponses.map(
            (response: any, index) => {
                const poolName = pools[index].poolName;

                if (!response || response.length !== 2) {
                    console.error(
                        `Unexpected lp token total supply response for pool ${poolName}:`,
                        response
                    );
                    return BigInt(0);
                }

                return BigInt(response[0]);
            }
        );

        const userSupplyData = userLpOwnedDataResponses.map((response: any, index) => {
            const pool = pools[index];
            const tokenTotalSupply = tokenTotalSupplyData[index];
            const supplyAPY = supplyAPYData[index];
            const lpTokenTotalSupply = lpTokenTotalSupplyData[index];

            if (!response || response.length !== 2) {
                console.error(
                    `Unexpected user lp owned response for pool ${pool.poolName}:`,
                    response
                );
                return {
                    pool: pool.poolName,
                    poolAddress: pool.poolAddress,
                    tokenAddress: pool.tokenAddress,
                    collateralTokenAddress: pool.collateralTokenAddress,
                    lpOwned: "0",
                    tokenSupplied: "0",
                    supplyAPY: "0",
                };
            }

            const lpOwned = BigInt(response[0]);
            const tokenSupplied =
                lpTokenTotalSupply === BigInt(0)
                    ? BigInt(0)
                    : (lpOwned * tokenTotalSupply) / lpTokenTotalSupply;

            return {
                pool: pool.poolName,
                poolAddress: pool.poolAddress,
                tokenAddress: pool.tokenAddress,
                collateralTokenAddress: pool.collateralTokenAddress,
                lpOwned: lpOwned.toString(),
                tokenSupplied: tokenSupplied.toString(),
                supplyAPY: supplyAPY.toString(),
            };
        });

        setUserSupplyData(userSupplyData);
    } catch (error) {
        console.error("Error fetching supply data:", error);
        throw error;
    }
};

export const fetchLatestUserBorrowData = async (
    pools: PoolRegistryEntry[],
    userAddress: string,
    tokenPrices: Record<string, bigint>,
    setUserBorrowData: (data: any[]) => void
) => {
    const userBorrowQuantityRequests = pools.map((pool) =>
        callContractLatest({
            contractAddress: pool.poolAddress,
            entrypoint: "get_user_borrow_quantity",
            calldata: CallData.compile([userAddress]),
        })
    );

    try {
        const userBorrowQuantityResponses = await Promise.all(
            userBorrowQuantityRequests
        );

        await delay(500);

        const userBorrowQuantities = userBorrowQuantityResponses.map(
            (response: any, index) => {
                const poolName = pools[index].poolName;

                if (!response || response.length !== 2) {
                    console.error(
                        `Unexpected user borrow quantity response for pool ${poolName}:`,
                        response
                    );
                    return BigInt(0);
                }

                return BigInt(response[0]);
            }
        );

        const userBorrowInfoRequests: Promise<any>[] = [];
        const borrowInfoMetadata: {
            pool: string;
            poolAddress: string;
            tokenAddress: string;
            collateralTokenAddress: string;
            borrowId: number;
        }[] = [];

        userBorrowQuantities.forEach((quantity, poolIndex) => {
            const pool = pools[poolIndex];

            for (let borrowId = 0; borrowId < quantity; borrowId++) {
                userBorrowInfoRequests.push(
                    callContractLatest({
                        contractAddress: pool.poolAddress,
                        entrypoint: "get_user_borrow_info",
                        calldata: CallData.compile([
                            userAddress,
                            {
                                low: borrowId.toString(),
                                high: 0,
                            },
                        ]),
                    })
                );

                borrowInfoMetadata.push({
                    pool: pool.poolName,
                    poolAddress: pool.poolAddress,
                    tokenAddress: pool.tokenAddress,
                    collateralTokenAddress: pool.collateralTokenAddress,
                    borrowId,
                });
            }
        });

        const userBorrowInfoResponses = await Promise.all(userBorrowInfoRequests);

        const userBorrowData = userBorrowInfoResponses
            .map((response: any, index) => {
                const metadata = borrowInfoMetadata[index];

                if (!response || response.length !== 9) {
                    console.error(
                        `Unexpected borrow info response for pool ${metadata.pool}, borrowId ${metadata.borrowId}:`,
                        response
                    );
                    return null;
                }

                const tokenPriceInUSD =
                    tokenPrices[metadata.tokenAddress.toLowerCase()] ?? BigInt(0);
                const collateralPriceInUSD =
                    tokenPrices[metadata.collateralTokenAddress.toLowerCase()] ??
                    BigInt(0);
                const currentUnixTimestamp = Math.floor(Date.now() / 1000);
                const borrowAmount = BigInt(response[0]);
                const collateralAmount = BigInt(response[2]);
                const borrowAPR = BigInt(response[6]);
                const borrowStartTime = BigInt(response[8]);
                const interest = calculateInterest(
                    borrowAmount,
                    borrowAPR,
                    borrowStartTime,
                    currentUnixTimestamp
                );
                const hf = calculateHealthFactor(
                    collateralAmount,
                    borrowAmount,
                    interest,
                    collateralPriceInUSD,
                    tokenPriceInUSD
                );

                return {
                    pool: metadata.pool,
                    poolAddress: metadata.poolAddress,
                    tokenAddress: metadata.tokenAddress,
                    collateralTokenAddress: metadata.collateralTokenAddress,
                    borrowId: metadata.borrowId,
                    borrowAmount: borrowAmount.toString(),
                    collateralAmount: collateralAmount.toString(),
                    hf,
                    borrowAPR: borrowAPR.toString(),
                    borrowStartTime: borrowStartTime.toString(),
                    interest: interest.toString(),
                };
            })
            .filter((item) => item !== null);

        setUserBorrowData(userBorrowData);
    } catch (error) {
        console.error("Error fetching borrow data:", error);
        throw error;
    }
};

export const fetchMarketDashboardData = async (
    setMarketData: (data: any[]) => void,
    setTokenPrices: (prices: Record<string, bigint>) => void
) => {
    try {
        const pools = await fetchPoolRegistry();
        let tokenPrices: Record<string, bigint> = {};
        await fetchLatestTokenPricesData(pools, (prices) => {
            tokenPrices = prices;
            setTokenPrices(prices);
        });

        await fetchLatestPoolInfoData(pools, tokenPrices, setMarketData);
    } catch (error) {
        console.error("Error fetching market dashboard data:", error);
    }
};

export const fetchLatestLiquidationData = async (
    pools: PoolRegistryEntry[],
    tokenPrices: Record<string, bigint>,
    setLiquidationData: (data: any[]) => void
) => {
    const activeBorrowerNumberRequests = pools.map((pool) =>
        callContractLatest({
            contractAddress: pool.poolAddress,
            entrypoint: "get_active_borrower_num",
        })
    );

    try {
        const activeBorrowerNumberResponses = await Promise.all(
            activeBorrowerNumberRequests
        );

        await delay(500);

        const activeBorrowerNumbers = activeBorrowerNumberResponses.map(
            (response: any, index) => {
                const poolName = pools[index].poolName;

                if (!response || response.length !== 2) {
                    console.error(
                        `Unexpected active borrower num response for pool ${poolName}:`,
                        response
                    );
                    return BigInt(0);
                }

                return BigInt(response[0]);
            }
        );

        const borrowerToPoolMapping: {
            borrower: string;
            poolAddress: string;
            poolName: string;
        }[] = [];
        const borrowerAddressRequests: Promise<void>[] = [];

        pools.forEach((pool, poolIndex) => {
            for (let i = 0; i < activeBorrowerNumbers[poolIndex]; i++) {
                borrowerAddressRequests.push(
                    callContractLatest({
                        contractAddress: pool.poolAddress,
                        entrypoint: "get_active_borrower",
                        calldata: CallData.compile([
                            {
                                low: i,
                                high: 0,
                            },
                        ]),
                    })
                        .then((response) => {
                            if (response && response.length === 1) {
                                borrowerToPoolMapping.push({
                                    borrower: response[0],
                                    poolAddress: pool.poolAddress,
                                    poolName: pool.poolName,
                                });
                            }
                        })
                );
            }
        });

        await Promise.all(borrowerAddressRequests);
        await delay(500);

        const borrowQuantityRequests = borrowerToPoolMapping.map((mapping) =>
            callContractLatest({
                contractAddress: mapping.poolAddress,
                entrypoint: "get_user_borrow_quantity",
                calldata: CallData.compile([mapping.borrower]),
            })
        );
        const borrowQuantityResponses = await Promise.all(borrowQuantityRequests);

        await delay(500);

        const borrowQuantities: BorrowQuantity[] = borrowQuantityResponses.map(
            (response, index) => {
                if (!response || response.length !== 2) {
                    console.error(
                        `Unexpected borrow quantity response for borrower ${borrowerToPoolMapping[index].borrower}:`,
                        response
                    );
                    return {
                        borrower: borrowerToPoolMapping[index].borrower,
                        poolAddress: borrowerToPoolMapping[index].poolAddress,
                        borrowQuantity: BigInt(0),
                    };
                }

                return {
                    borrower: borrowerToPoolMapping[index].borrower,
                    poolAddress: borrowerToPoolMapping[index].poolAddress,
                    borrowQuantity: BigInt(response[0]),
                };
            }
        );

        const borrowInfoRequests: Promise<any>[] = [];
        const borrowIdCache: BorrowIdCacheEntry[] = [];

        borrowQuantities.forEach(({ borrower, poolAddress, borrowQuantity }) => {
            const pool = pools.find((entry) => entry.poolAddress === poolAddress);
            if (!pool) {
                throw new Error(`Pool metadata not found for address: ${poolAddress}`);
            }

            for (let borrowId = 0; borrowId < borrowQuantity; borrowId++) {
                borrowInfoRequests.push(
                    callContractLatest({
                        contractAddress: poolAddress,
                        entrypoint: "get_user_borrow_info",
                        calldata: CallData.compile([
                            borrower,
                            {
                                low: borrowId.toString(),
                                high: 0,
                            },
                        ]),
                    })
                );

                borrowIdCache.push({
                    borrower,
                    poolAddress,
                    poolName: pool.poolName,
                    borrowId: borrowId.toString(),
                });
            }
        });

        const borrowInfoResponses = await Promise.all(borrowInfoRequests);

        const liquidationData = borrowInfoResponses
            .map((response, index) => {
                if (!response || response.length !== 9) {
                    console.error(
                        `Unexpected borrow info response for borrower ${borrowIdCache[index]?.borrower}:`,
                        response
                    );
                    return null;
                }

                const { borrower, poolAddress, poolName, borrowId } = borrowIdCache[index];
                const pool = pools.find((entry) => entry.poolAddress === poolAddress);
                if (!pool) {
                    console.error(`Pool metadata not found for liquidation pool ${poolAddress}`);
                    return null;
                }
                const tokenPriceInUSD =
                    tokenPrices[pool.tokenAddress.toLowerCase()] ?? BigInt(0);
                const collateralPriceInUSD =
                    tokenPrices[pool.collateralTokenAddress.toLowerCase()] ?? BigInt(0);
                const currentUnixTimestamp = Math.floor(Date.now() / 1000);
                const borrowAmount = BigInt(response[0]);
                const collateralAmount = BigInt(response[2]);
                const borrowAPR = BigInt(response[6]);
                const borrowStartTime = BigInt(response[8]);
                const interest = calculateInterest(
                    borrowAmount,
                    borrowAPR,
                    borrowStartTime,
                    currentUnixTimestamp
                );
                const hf = calculateHealthFactor(
                    collateralAmount,
                    borrowAmount,
                    interest,
                    collateralPriceInUSD,
                    tokenPriceInUSD
                );

                return {
                    poolName,
                    poolAddr: poolAddress,
                    tokenAddress: pool.tokenAddress,
                    collateralTokenAddress: pool.collateralTokenAddress,
                    borrowerAddress: borrower,
                    borrowId,
                    borrowAmount: borrowAmount.toString(),
                    collateralAmount: collateralAmount.toString(),
                    hf,
                    borrowAPR: borrowAPR.toString(),
                    borrowStartTime: borrowStartTime.toString(),
                    interest: interest.toString(),
                };
            })
            .filter((item) => item !== null);

        setLiquidationData(liquidationData);
    } catch (error) {
        console.error("Error fetching liquidation data:", error);
        throw error;
    }
};
