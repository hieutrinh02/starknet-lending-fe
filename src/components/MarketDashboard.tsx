import { useAtom, useSetAtom } from "jotai";
import {
    HStack,
    Box,
    Button,
    Flex,
    Text,
    Tooltip,
    Spinner,
    IconButton,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import { FC, useEffect } from "react";
import { fetchMarketDashboardData } from "@/services/getData";
import {
    type MarketPool,
    marketDataAtom,
    loadingMarketAtom,
    borrowModalLoadingAtom,
    modalStateAtom,
    activePoolAtom,
    amountAtom,
    collateralAmountAtom,
    walletStarknetKitAtom,
    tokenPriceDataAtom,
    reloadMarketAtom,
} from "@/state";
import { formatNumber, formatPercentage, formatUSDNumber } from "@/utils";
import SupplyModal from "./custom-modal/ModalSupply";
import BorrowModal from "./custom-modal/ModalBorrow";
import { connectWallet } from "./ConnectButton";

const MarketDashboard: FC = () => {
    const [wallet, setWallet] = useAtom(walletStarknetKitAtom);
    const [reloadMarket, setReloadMarket] = useAtom(reloadMarketAtom);
    const [loadingMarket, setLoadingMarket] = useAtom(loadingMarketAtom);
    const [borrowModalLoading, setBorrowModalLoading] = useAtom(
        borrowModalLoadingAtom
    );
    const [marketData, setMarketData] = useAtom(marketDataAtom);
    const setTokenPriceData = useSetAtom(tokenPriceDataAtom);
    const setModalOpen = useSetAtom(modalStateAtom);
    const setActivePool = useSetAtom(activePoolAtom);
    const setAmount = useSetAtom(amountAtom);
    const setCollateralAmount = useSetAtom(collateralAmountAtom);

    const handleButtonClick = async (
        pool: MarketPool,
        type: "Supply" | "Borrow"
    ) => {
        if (!wallet?.isConnected) {
            try {
                const { wallet } = await connectWallet();
                setWallet(wallet);
                if (wallet?.isConnected) {
                    if (type === "Borrow") {
                        setBorrowModalLoading(pool.pool);
                        await fetchMarketDashboardData(setMarketData, setTokenPriceData);
                        setBorrowModalLoading(null);
                    }
                    setActivePool(pool);
                    setAmount("");
                    setCollateralAmount("");
                    setModalOpen({ isOpen: true, type });
                }
            } catch (e) {
                console.error(e);
                alert((e as Error).message);
                setBorrowModalLoading(null);
            }
        } else {
            if (type === "Borrow") {
                setBorrowModalLoading(pool.pool);
                await fetchMarketDashboardData(setMarketData, setTokenPriceData);
                setBorrowModalLoading(null);
            }
            setActivePool(pool);
            setAmount("");
            setCollateralAmount("");
            setModalOpen({ isOpen: true, type });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingMarket(true);
                await fetchMarketDashboardData(setMarketData, setTokenPriceData);
            } catch (error) {
                console.error("Error fetching market data:", error);
            } finally {
                setLoadingMarket(false);
            }
        };

        fetchData();
    }, [reloadMarket, setTokenPriceData, setMarketData, setLoadingMarket]);

    if (loadingMarket) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Spinner size="xl" color="gray.700" />
            </Flex>
        );
    }

    return (
        <>
            <SupplyModal />
            <BorrowModal />

            <Flex direction="column" gap="5">
                <Flex
                    direction={{ base: "column", md: "row" }}
                    justify="space-between"
                    align={{ base: "flex-start", md: "center" }}
                    gap="4"
                    px={{ base: "1", md: "2" }}
                >
                    <Text
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.22em"
                        color="gray.500"
                        fontWeight="semibold"
                    >
                        Market Overview
                    </Text>

                    <IconButton
                        size="sm"
                        aria-label="Refresh market data"
                        onClick={() => setReloadMarket((prev) => !prev)}
                        icon={<RepeatIcon />}
                        bg="white"
                        color="gray.900"
                        borderWidth="1px"
                        borderColor="gray.200"
                        rounded="full"
                        boxShadow="0 12px 24px rgba(15,23,42,0.08)"
                        _hover={{ bg: "gray.50" }}
                    />
                </Flex>

                <Box
                    bg="rgba(255,255,255,0.78)"
                    borderWidth="1px"
                    borderColor="rgba(148,163,184,0.18)"
                    rounded="3xl"
                    px={{ base: "3", md: "4" }}
                    py={{ base: "3", md: "4" }}
                    boxShadow="0 24px 60px rgba(15,23,42,0.08)"
                >
                    <Flex justify="space-between" align="center" px="6" py="2">
                        <Text fontWeight="bold" fontSize="xs" color="gray.500" flex="1.2" textAlign="center" textTransform="uppercase" letterSpacing="0.16em">
                            Supply Token
                        </Text>
                        <Text fontWeight="bold" fontSize="xs" color="gray.500" flex="1.2" textAlign="center" textTransform="uppercase" letterSpacing="0.16em">
                            Collateral
                        </Text>
                        <Text fontWeight="bold" fontSize="xs" color="gray.500" flex="1" textAlign="center" textTransform="uppercase" letterSpacing="0.16em">
                            Total Supply
                        </Text>
                        <Text fontWeight="bold" fontSize="xs" color="gray.500" flex="1" textAlign="center" textTransform="uppercase" letterSpacing="0.16em">
                            Total Borrow
                        </Text>
                        <Text fontWeight="bold" fontSize="xs" color="gray.500" flex="1" textAlign="center" textTransform="uppercase" letterSpacing="0.16em">
                            Available
                        </Text>
                        <Text fontWeight="bold" fontSize="xs" color="gray.500" flex="1" textAlign="center" textTransform="uppercase" letterSpacing="0.16em">
                            Utilization
                        </Text>
                        <Text fontWeight="bold" fontSize="xs" color="gray.500" flex="1" textAlign="center" textTransform="uppercase" letterSpacing="0.16em">
                            Supply APY
                        </Text>
                        <Text fontWeight="bold" fontSize="xs" color="gray.500" flex="1" textAlign="center" textTransform="uppercase" letterSpacing="0.16em">
                            Borrow APR
                        </Text>
                        <Text fontWeight="bold" fontSize="xs" color="gray.500" flex="1" textAlign="center" textTransform="uppercase" letterSpacing="0.16em">
                            Actions
                        </Text>
                    </Flex>

                    <Flex direction="column" gap="3">
                        {[...marketData].sort((a, b) => Number(b.supplyAPY) - Number(a.supplyAPY))
                            .map((row, index) => {
                        const [supplyToken, collateral] = row.pool.split("/");

                        return (
                            <Box
                                key={index}
                                bg="cardBackround"
                                p="3"
                                minH="16"
                                rounded="2xl"
                                shadow="sm"
                                borderWidth="1px"
                                borderColor="gray.100"
                                _hover={{ shadow: "md", transform: "translateY(-1px)" }}
                                transition="all 0.2s ease"
                            >
                                <Flex justify="space-between" align="center">
                                    {/* Supply Token */}
                                    <Flex align="center" justify="center" flex="1.2">
                                        <Flex direction="column" align="center">
                                            <Text
                                                fontSize="sm"
                                                fontWeight="bold"
                                                color="gray.900"
                                                textAlign="center"
                                            >
                                                {supplyToken}
                                            </Text>
                                        </Flex>
                                    </Flex>

                                    {/* Collateral */}
                                    <Flex align="center" justify="center" flex="1.2">
                                        <Flex direction="column" align="center">
                                            <Text
                                                fontSize="sm"
                                                fontWeight="bold"
                                                color="gray.900"
                                                textAlign="center"
                                            >
                                                {collateral}
                                            </Text>
                                        </Flex>
                                    </Flex>

                                    {/* Total Supply */}
                                    <Tooltip
                                        label={
                                            <HStack spacing="1.5" align="center">
                                                <Box as="span">{`${formatNumber(
                                                    Number(row.totalSupply)
                                                )}`}</Box>
                                                <Box as="span">{`${supplyToken}`}</Box>
                                            </HStack>
                                        }
                                        bg="gray.900"
                                        color="white"
                                        fontSize="sm"
                                    >
                                        <Text
                                            fontSize="sm"
                                            color="gray.800"
                                            flex="1"
                                            textAlign="center"
                                            cursor="pointer"
                                        >
                                            {formatUSDNumber(Number(row.totalSupplyInUSD))}
                                        </Text>
                                    </Tooltip>

                                    {/* Total Borrow */}
                                    <Tooltip
                                        label={
                                            <HStack spacing="1.5" align="center">
                                                <Box as="span">{`${formatNumber(
                                                    Number(row.totalBorrow)
                                                )}`}</Box>
                                                <Box as="span">{`${supplyToken}`}</Box>
                                            </HStack>
                                        }
                                        bg="gray.900"
                                        color="white"
                                        fontSize="sm"
                                    >
                                        <Text
                                            fontSize="sm"
                                            color="gray.800"
                                            flex="1"
                                            textAlign="center"
                                            cursor="pointer"
                                        >
                                            {formatUSDNumber(Number(row.totalBorrowInUSD))}
                                        </Text>
                                    </Tooltip>

                                    {/* Available */}
                                    <Tooltip
                                        label={
                                            <HStack spacing="1.5" align="center">
                                                <Box as="span">{`${formatNumber(Number(row.totalSupply) -
                                                    Number(row.totalBorrow)
                                                )}`}</Box>
                                                <Box as="span">{`${supplyToken}`}</Box>
                                            </HStack>
                                        }
                                        bg="gray.900"
                                        color="white"
                                        fontSize="sm"
                                    >
                                        <Text
                                            fontSize="sm"
                                            color="gray.800"
                                            flex="1"
                                            textAlign="center"
                                            cursor="pointer"
                                        >
                                            {formatUSDNumber(Number(row.totalSupplyInUSD) - Number(row.totalBorrowInUSD))}
                                        </Text>
                                    </Tooltip>

                                    {/* Utilization Rate */}
                                    <Text
                                        fontSize="sm"
                                        color="gray.800"
                                        flex="1"
                                        textAlign="center"
                                    >
                                        {formatPercentage(Number(row.ur))}%
                                    </Text>

                                    {/* Supply APY */}
                                    <Text
                                        fontSize="sm"
                                        color="green.700"
                                        fontWeight="semibold"
                                        flex="1"
                                        textAlign="center"
                                    >
                                        {formatPercentage(Number(row.supplyAPY))}%
                                    </Text>

                                    {/* Borrow APR */}
                                    <Text
                                        fontSize="sm"
                                        color="red.600"
                                        fontWeight="semibold"
                                        flex="1"
                                        textAlign="center"
                                    >
                                        {formatPercentage(Number(row.borrowAPR))}%
                                    </Text>

                                    {/* Actions */}
                                    <Flex gap="2" flex="1" justify="center">
                                        <Button
                                            size="sm"
                                            bg="green.700"
                                            color="white"
                                            _hover={{ bg: "green.800" }}
                                            _active={{ bg: "green.800" }}
                                            onClick={() =>
                                                handleButtonClick(
                                                    {
                                                        pool: row.pool,
                                                        poolAddress: row.poolAddress,
                                                        tokenAddress: row.tokenAddress,
                                                        collateralTokenAddress: row.collateralTokenAddress,
                                                    },
                                                    "Supply"
                                                )
                                            }
                                        >
                                            Supply
                                        </Button>
                                        <Tooltip
                                            label={
                                                row.totalSupply === "0"
                                                    ? "No supply available for borrowing."
                                                    : ""
                                            }
                                            bg="gray.900"
                                            color="white"
                                            fontSize="sm"
                                            w="full"
                                            isDisabled={row.totalSupply !== "0"} // Only show tooltip if total supply is 0
                                        >
                                            <Box>
                                                <Button
                                                    size="sm"
                                                    bg="red.600"
                                                    color="white"
                                                    _hover={{ bg: "red.700" }}
                                                    _active={{ bg: "red.700" }}
                                                    onClick={() =>
                                                        handleButtonClick(
                                                            {
                                                                pool: row.pool,
                                                                poolAddress: row.poolAddress,
                                                                tokenAddress: row.tokenAddress,
                                                                collateralTokenAddress:
                                                                    row.collateralTokenAddress,
                                                            },
                                                            "Borrow"
                                                        )
                                                    }
                                                    isDisabled={row.totalSupply === "0"}
                                                    isLoading={borrowModalLoading === row.pool}
                                                    _disabled={{
                                                        bg: "red.200",
                                                        color: "red.800",
                                                        opacity: 1,
                                                        cursor: "not-allowed",
                                                    }}
                                                >
                                                    Borrow
                                                </Button>
                                            </Box>
                                        </Tooltip>
                                    </Flex>
                                </Flex>
                            </Box>
                        );
                    })}
                    </Flex>
                </Box>
            </Flex>
        </>
    );
};

export { MarketDashboard };
