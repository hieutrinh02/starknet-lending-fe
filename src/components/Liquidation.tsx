import { useAtom, useSetAtom } from "jotai";
import { FC, useEffect } from "react";
import {
    VStack,
    HStack,
    Flex,
    Button,
    Box,
    Text,
    Spinner,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import {
    fetchPoolRegistry,
    fetchLatestLiquidationData,
    fetchLatestTokenPricesData,
} from "@/services/getData";
import {
    type LiquidationDataItem,
    loadingLiquidationAtom,
    reloadLiquidationAtom,
    tokenPriceDataAtom,
    liquidationDataAtom,
    activeLiquidationAtom,
    modalStateAtom,
    activePoolAtom,
} from "@/state";
import {
    UPPER_LIQUIDATION_THRESHOLD,
    LIQUIDATION_THRESHOLD,
    LOWER_LIQUIDATION_THRESHOLD,
} from "@/constants";
import {
    formatInterestNumber,
    formatNumber,
    formatPercentage,
    formatUserBorrowNumber,
} from "@/utils";
import LiquidateModal from "./custom-modal/ModalLiquidate";

const Liquidation: FC = () => {
    const [loadingLiquidation, setLoadingLiquidation] = useAtom(
        loadingLiquidationAtom
    );
    const [reloadLiquidation, setReloadLiquidation] = useAtom(
        reloadLiquidationAtom
    );
    const [tokenPriceData, setTokenPriceData] = useAtom(tokenPriceDataAtom);
    const [liquidationData, setLiquidationData] = useAtom(liquidationDataAtom);
    const setModalOpen = useSetAtom(modalStateAtom);
    const setActivePool = useSetAtom(activePoolAtom);
    const setActiveLiquidation = useSetAtom(activeLiquidationAtom);

    const handleButtonClick = async (
        type: "Liquidate",
        liquidationData: LiquidationDataItem
    ) => {
        setActiveLiquidation(liquidationData);
        setActivePool({
            pool: liquidationData.poolName,
            poolAddress: liquidationData.poolAddr,
            tokenAddress: liquidationData.tokenAddress,
            collateralTokenAddress: liquidationData.collateralTokenAddress,
        });
        setModalOpen({ isOpen: true, type });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingLiquidation(true);
                const pools = await fetchPoolRegistry();
                let tokenPrices: Record<string, bigint> = {};
                await fetchLatestTokenPricesData(pools, (prices) => {
                    tokenPrices = prices;
                    setTokenPriceData(prices);
                });
                await fetchLatestLiquidationData(pools, tokenPrices, (data) => {
                    // Sắp xếp theo HF tăng dần
                    const sortedData = [...data].sort((a, b) => parseFloat(a.hf) - parseFloat(b.hf));
                    setLiquidationData(sortedData);
                });
            } catch (error) {
                console.error("Error fetching liquidation data:", error);
            } finally {
                setLoadingLiquidation(false);
            }
        };

        fetchData();
    }, [reloadLiquidation, setLiquidationData, setLoadingLiquidation]);

    if (loadingLiquidation) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Spinner size="xl" color="gray.700" />
            </Flex>
        );
    }

    return (
        <>
            <LiquidateModal />

            {/* Reload Button */}
            <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} mb="5" direction={{ base: "column", md: "row" }} gap="4">
                <Text
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.22em"
                    color="gray.500"
                    fontWeight="semibold"
                >
                    Liquidation Monitor
                </Text>
                <IconButton
                    size="sm"
                    aria-label="Refresh liquidation data"
                    onClick={() => setReloadLiquidation((prev) => !prev)}
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
                flex="1"
                bg="rgba(255,255,255,0.82)"
                p="7"
                borderRadius="3xl"
                boxShadow="0 24px 60px rgba(15,23,42,0.08)"
                borderWidth="1px"
                borderColor="rgba(148,163,184,0.18)"
            >
                <VStack spacing="4" align="start" w="full">
                    {liquidationData.length > 0 ? (
                        <Table variant="simple" colorScheme="gray">
                            <Thead>
                                <Tr>
                                    <Th color="gray.700" fontSize="xs" textAlign="center">
                                        Pool
                                    </Th>
                                    <Th color="gray.700" fontSize="xs" textAlign="center">
                                        Borrower
                                    </Th>
                                    <Th color="gray.700" fontSize="xs" textAlign="center">
                                        Borrow
                                    </Th>
                                    <Th color="gray.700" fontSize="xs" textAlign="center">
                                        Collateral
                                    </Th>
                                    <Th color="gray.700" fontSize="xs" textAlign="center">
                                        Health Factor
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
                                {liquidationData.map((item, index) => {
                                    const [token, collateral] = item.poolName.split("/");

                                    return (
                                        <Tr key={index}>
                                            {/* Pool Column */}
                                            <Td textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                <Text fontSize="sm">{item.poolName}</Text>
                                            </Td>

                                            {/* Borrower Column */}
                                            <Td fontSize="sm" textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                <Flex justify="center">
                                                    {item.borrowerAddress.slice(0, 5)}...
                                                    {item.borrowerAddress.slice(-6)}
                                                </Flex>
                                            </Td>

                                            {/* Borrow Amount Column */}
                                            <Td fontSize="sm" textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                <HStack spacing="1.5" justify="center">
                                                    <Box as="span">{`${formatUserBorrowNumber(
                                                        Number(item.borrowAmount)
                                                    )}`}</Box>
                                                    <Box as="span">{`${token}`}</Box>
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
                                                <Flex justify="center">
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
                                                </Flex>
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
                                                    <Box as="span">{`${token}`}</Box>
                                                </HStack>
                                            </Td>

                                            {/* Action Column */}
                                            <Td textAlign="center" borderBottomWidth="0.5px" borderColor="gray.600">
                                                <Button
                                                    size="sm"
                                                    bg="gray.900"
                                                    color="white"
                                                    _hover={{ bg: "black" }}
                                                    _active={{ bg: "black" }}
                                                    onClick={() => handleButtonClick("Liquidate", item)}
                                                    isDisabled={
                                                        Number(item.hf) > LOWER_LIQUIDATION_THRESHOLD
                                                    }
                                                    _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                                                >
                                                    Liquidate
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
        </>
    );
};

export { Liquidation };
