import {
    Box,
    Heading,
    HStack,
    VStack,
    Flex,
    Text,
    Spinner,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    IconButton,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import { useAtom, useSetAtom } from "jotai";
import { FC, useEffect } from "react";
import {
    formatNumber,
    formatUserSupplyNumber,
    formatUserBorrowNumber,
    formatPercentage,
    formatInterestNumber,
} from "@/utils";
import {
    fetchPoolRegistry,
    fetchLatestTokenPricesData,
    fetchLatestUserBorrowData,
    fetchLatestUserSupplyData,
} from "@/services/getData";
import {
    type UserBorrowDataItem,
    type UserSupplyDataItem,
    userSupplyDataAtom,
    walletStarknetKitAtom,
    loadingDashboardAtom,
    reloadDashboardAtom,
    lpAmountWithdrawAtom,
    activePoolAtom,
    modalStateAtom,
    userBorrowDataAtom,
    tokenPriceDataAtom,
    activeBorrowAtom,
    activeSupplyAtom,
} from "@/state";
import {
    UPPER_LIQUIDATION_THRESHOLD,
    LIQUIDATION_THRESHOLD,
} from "@/constants";
import WithdrawModal from "./custom-modal/ModalWithdraw";
import RepayModal from "./custom-modal/ModalRepay";

const Dashboard: FC = () => {
    const [wallet, setWallet] = useAtom(walletStarknetKitAtom);
    const [reloadDashboard, setReloadDashboard] = useAtom(reloadDashboardAtom);
    const [loadingDashboard, setLoadingDashboard] = useAtom(loadingDashboardAtom);
    const [tokenPriceData, setTokenPriceData] = useAtom(tokenPriceDataAtom);
    const [userSupplyData, setUserSupplyData] = useAtom(userSupplyDataAtom);
    const [userBorrowData, setUserBorrowData] = useAtom(userBorrowDataAtom);
    const setModalOpen = useSetAtom(modalStateAtom);
    const setActivePool = useSetAtom(activePoolAtom);
    const setLpAmountWithdraw = useSetAtom(lpAmountWithdrawAtom);
    const setActiveSupply = useSetAtom(activeSupplyAtom);
    const setActiveBorrow = useSetAtom(activeBorrowAtom);

    const handleButtonClick = async (
        type: "Withdraw" | "Repay",
        supplyData?: UserSupplyDataItem,
        borrowData?: UserBorrowDataItem
    ) => {
        if (type === "Withdraw" && supplyData) {
            setLpAmountWithdraw("");
            setActivePool({
                pool: supplyData.pool,
                poolAddress: supplyData.poolAddress,
                tokenAddress: supplyData.tokenAddress,
                collateralTokenAddress: supplyData.collateralTokenAddress,
            });
            setActiveSupply(supplyData);
        } else if (type === "Repay" && borrowData) {
            setActivePool({
                pool: borrowData.pool,
                poolAddress: borrowData.poolAddress,
                tokenAddress: borrowData.tokenAddress,
                collateralTokenAddress: borrowData.collateralTokenAddress,
            });
            setActiveBorrow(borrowData);
        }
        setModalOpen({ isOpen: true, type });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingDashboard(true);
                if (wallet?.isConnected) {
                    const pools = await fetchPoolRegistry();
                    await fetchLatestUserSupplyData(
                        pools,
                        wallet?.account?.address.toString(),
                        setUserSupplyData
                    );
                    let tokenPrices: Record<string, bigint> = {};
                    await fetchLatestTokenPricesData(pools, (prices) => {
                        tokenPrices = prices;
                        setTokenPriceData(prices);
                    });
                    await fetchLatestUserBorrowData(
                        pools,
                        wallet?.account?.address.toString(),
                        tokenPrices,
                        setUserBorrowData
                    );
                }
            } catch (error) {
                console.error("Error fetching supply data:", error);
            } finally {
                setLoadingDashboard(false);
            }
        };

        fetchData();
    }, [
        wallet,
        reloadDashboard,
        setUserSupplyData,
        setUserBorrowData,
        setLoadingDashboard,
    ]);

    if (loadingDashboard) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Spinner size="xl" color="gray.700" />
            </Flex>
        );
    }

    const filteredSupplyData = userSupplyData.filter(
        (item) => item.lpOwned !== "0" &&
            parseFloat(item.lpOwned) >= 0.0000001
    );

    return (
        <>
            <WithdrawModal />
            <RepayModal />

            {/* Reload Button */}
            <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} mb="5" direction={{ base: "column", md: "row" }} gap="4">
                <Text
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.22em"
                    color="gray.500"
                    fontWeight="semibold"
                >
                    Account Center
                </Text>
                <IconButton
                    size="sm"
                    aria-label="Refresh dashboard data"
                    onClick={() => setReloadDashboard((prev) => !prev)}
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

            <Flex
                w="full"
                maxW="1600px"
                gap="6"
                direction={{ base: "column", md: "row" }} // Stack on small screens, side-by-side on larger screens
            >
                {/* My Supply Section */}
                <Box
                    flex="1"
                    bg="rgba(255,255,255,0.82)"
                    p="7"
                    borderRadius="3xl"
                    boxShadow="0 24px 60px rgba(15,23,42,0.08)"
                    borderWidth="1px"
                    borderColor="rgba(148,163,184,0.18)"
                >
                    <Heading size="md" mb="4">
                        My Supply
                    </Heading>
                    <VStack spacing="4" align="start" w="full">
                        {filteredSupplyData.length > 0 && wallet?.isConnected ? (
                            <Table variant="simple" colorScheme="gray">
                                <Thead>
                                    <Tr>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            {" "}
                                            {/* Center alignment */}
                                            Pool
                                        </Th>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            {" "}
                                            Supply
                                        </Th>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            {" "}
                                            LP(s)
                                        </Th>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            {" "}
                                            APY
                                        </Th>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            {" "}
                                            {/* Center alignment */}
                                            Action
                                        </Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredSupplyData.map((item, index) => {
                                        const [supplyToken, collateral] = item.pool.split("/");

                                        return (
                                            <Tr key={index}>
                                                {/* Pool Column */}
                                                <Td textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                    <Text fontSize="sm">{item.pool}</Text>
                                                </Td>

                                                {/* Tokens Supplied Column */}
                                                <Td fontSize="sm" textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                    <HStack spacing="1.5" justify="center">
                                                        <Box as="span">{`${formatUserSupplyNumber(
                                                            Number(item.tokenSupplied)
                                                        )}`}</Box>
                                                        <Box as="span">{`${supplyToken}`}</Box>
                                                    </HStack>
                                                </Td>

                                                {/* LP Owned Column */}
                                                <Td fontSize="sm" textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                    {formatNumber(Number(item.lpOwned))}
                                                </Td>

                                                {/* APY Column */}
                                                <Td fontSize="sm" textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                    <Text color="green.700" fontWeight="semibold">
                                                        {formatPercentage(Number(item.supplyAPY))}%
                                                    </Text>
                                                </Td>

                                                {/* Action Column */}
                                                <Td textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                    <Button
                                                        size="sm"
                                                        bg="gray.900"
                                                        color="white"
                                                        _hover={{ bg: "black" }}
                                                        _active={{ bg: "black" }}
                                                        onClick={() =>
                                                            handleButtonClick(
                                                                "Withdraw",
                                                                item,
                                                                undefined
                                                            )
                                                        }
                                                    >
                                                        Withdraw
                                                    </Button>
                                                </Td>
                                            </Tr>
                                        );
                                    })}
                                </Tbody>
                            </Table>
                        ) : (
                            <Text>No supplies found.</Text>
                        )}
                    </VStack>
                </Box>

                {/* My Borrow Section */}
                <Box
                    flex="1"
                    bg="rgba(255,255,255,0.82)"
                    p="7"
                    borderRadius="3xl"
                    boxShadow="0 24px 60px rgba(15,23,42,0.08)"
                    borderWidth="1px"
                    borderColor="rgba(148,163,184,0.18)"
                >
                    <Heading size="md" mb="4">
                        My Borrow
                    </Heading>
                    <VStack spacing="4" align="start" w="full">
                        {userBorrowData.length > 0 && wallet?.isConnected ? (
                            <Table variant="simple" colorScheme="gray">
                                <Thead>
                                    <Tr>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            Pool
                                        </Th>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            Borrow
                                        </Th>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            Collateral
                                        </Th>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            HF
                                        </Th>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            APR
                                        </Th>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            Interest
                                        </Th>
                                        <Th color="gray.700" fontSize="xs" textAlign="center">
                                            Action
                                        </Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {userBorrowData.map((item, index) => {
                                        const [borrowToken, collateral] = item.pool.split("/");

                                        return (
                                            <Tr key={index}>
                                                {/* Pool Column */}
                                                <Td textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                    <Text fontSize="sm">{item.pool}</Text>
                                                </Td>

                                                {/* Borrow Amount Column */}
                                                <Td fontSize="sm" textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                    <HStack spacing="1.5" justify="center">
                                                        <Box as="span">{`${formatUserBorrowNumber(
                                                            Number(item.borrowAmount)
                                                        )}`}</Box>
                                                        <Box as="span">{`${borrowToken}`}</Box>
                                                    </HStack>
                                                </Td>

                                                {/* Collateral Amount Column */}
                                                <Td fontSize="sm" textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                    <HStack spacing="1.5" justify="center">
                                                        <Box as="span">{`${formatNumber(
                                                            Number(item.collateralAmount)
                                                        )}`}</Box>
                                                        <Box as="span">{`${collateral}`}</Box>
                                                    </HStack>
                                                </Td>

                                                {/* Health Factor Column */}
                                                <Td fontSize="sm" textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                    <Text
                                                        fontWeight="semibold"
                                                        color={
                                                            Number(item.hf) >= UPPER_LIQUIDATION_THRESHOLD
                                                                ? "green.700"
                                                                : Number(item.hf) >= LIQUIDATION_THRESHOLD
                                                                    ? "warning.500"
                                                                    : "red.600"
                                                        }
                                                    >
                                                        {Number(item.hf).toFixed(2)}
                                                    </Text>
                                                </Td>

                                                {/* Borrow APR Column */}
                                                <Td fontSize="sm" textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                    <Text color="red.600" fontWeight="semibold">
                                                        {formatPercentage(Number(item.borrowAPR))}%
                                                    </Text>
                                                </Td>

                                                {/* Interest Column */}
                                                <Td fontSize="sm" textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                    <HStack spacing="1.5" justify="center">
                                                        <Box as="span">{`${formatInterestNumber(
                                                            Number(item.interest)
                                                        )}`}</Box>
                                                        <Box as="span">{`${borrowToken}`}</Box>
                                                    </HStack>
                                                </Td>

                                                {/* Action Column */}
                                                <Td textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600" >
                                                    <Button
                                                        size="sm"
                                                        bg="gray.900"
                                                        color="white"
                                                        _hover={{ bg: "black" }}
                                                        _active={{ bg: "black" }}
                                                        onClick={() =>
                                                            handleButtonClick("Repay", undefined, item)
                                                        }
                                                    >
                                                        Repay
                                                    </Button>
                                                </Td>
                                            </Tr>
                                        );
                                    })}
                                </Tbody>
                            </Table>
                        ) : (
                            <Text>No borrows found.</Text>
                        )}
                    </VStack>
                </Box>
            </Flex>
        </>
    );
};

export { Dashboard };
