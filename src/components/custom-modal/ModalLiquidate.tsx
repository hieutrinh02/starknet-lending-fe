import { useAtom } from "jotai";
import { useState } from "react";
import {
    HStack,
    VStack,
    Flex,
    Box,
    Text,
    Link,
    useToast,
} from "@chakra-ui/react";
import CustomModal from ".";
import { activeLiquidationAtom, modalStateAtom } from "@/state";
import useStarknet from "@/services/invokeContract";
import {
    formatUnits,
    formatUserBorrowNumber,
    formatInterestNumber,
    formatCollateralNumber,
} from "@/utils";

const LiquidateModal = () => {
    const [loading, setLoading] = useState(false);
    const [modalState, setModalState] = useAtom(modalStateAtom);
    const [activeLiquidation] = useAtom(activeLiquidationAtom);
    const { handleLiquidate } = useStarknet();
    const toast = useToast();

    const [repayToken, collateralToken] = activeLiquidation?.poolName
        ? activeLiquidation.poolName.split("/")
        : ["", ""];
    const repayTokenAddr = activeLiquidation?.tokenAddress;
    const collateralTokenAddr = activeLiquidation?.collateralTokenAddress;
    const borrowId = activeLiquidation?.borrowId;

    const handleConfirm = async () => {
        if (!repayTokenAddr || !collateralTokenAddr || borrowId === undefined) {
            return;
        }

        try {
            setLoading(true);
            const totalLiquidationAmount = formatUnits(
                BigInt(activeLiquidation.borrowAmount) + BigInt(activeLiquidation.interest),
                18,
                { trimTrailingZeros: true }
            );
            let res = await handleLiquidate({
                repayTokenAddr: repayTokenAddr,
                collateralAddr: collateralTokenAddr,
                borrower: activeLiquidation?.borrowerAddress,
                borrowId: borrowId,
                totalLiquidationAmount,
            });
            if (res.transaction_hash) {
                setLoading(false);
                toast({
                    title: "Liquidate Successful",
                    description: (
                        <Text>
                            Tx:{" "}
                            <Link
                                href={`https://sepolia.voyager.online/tx/${res.transaction_hash}`}
                                isExternal
                                color="white"
                                fontWeight="semibold"
                                textDecoration="underline"
                                textUnderlineOffset="3px"
                                _hover={{
                                    color: "gray.100",
                                    textDecorationThickness: "2px",
                                }}
                            >
                                View on Voyager
                            </Link>
                        </Text>
                    ),
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                    containerStyle: {
                        margin: "6",
                    },
                });
                setModalState({ isOpen: false, type: undefined });
            }
        } catch (error: any) {
            toast({
                title: "Error Occurred",
                description: error.message || "An unexpected error occurred.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
                containerStyle: {
                    margin: "6",
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setModalState({ isOpen: false, type: undefined });
    };

    if (
        !modalState.isOpen ||
        modalState.type !== "Liquidate" ||
        !activeLiquidation
    ) {
        return null;
    }

    return (
        <CustomModal
            title={
                <HStack spacing="2.5" align="center">
                    <Box as="span">{`Liquidate ${repayToken}`}</Box>
                </HStack>
            }
            isOpen={modalState.isOpen}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            loading={loading}
        >
            <VStack spacing="6" p="4" align="stretch">
                <Flex justifyContent="space-between" w="full">
                    <Text fontSize="lg" color="gray.800">
                        Borrow Amount:
                    </Text>
                    <Text fontSize="lg" color="gray.800" textAlign="right">
                        {formatUserBorrowNumber(Number(activeLiquidation?.borrowAmount))}{" "}
                        {repayToken}
                    </Text>
                </Flex>
                <Flex justifyContent="space-between" w="full">
                    <Text fontSize="lg" color="gray.800">
                        Interest Amount:
                    </Text>
                    <Text fontSize="lg" color="gray.800" textAlign="right">
                        {formatInterestNumber(Number(activeLiquidation?.interest))}{" "}
                        {repayToken}
                    </Text>
                </Flex>
                <Flex justifyContent="space-between" w="full">
                    <Text fontSize="lg" color="gray.800">
                        Total Loan:
                    </Text>
                    <Text fontSize="lg" color="gray.800" textAlign="right">
                        {formatUserBorrowNumber(
                            Number(activeLiquidation?.borrowAmount) +
                            Number(activeLiquidation?.interest)
                        )}{" "}
                        {repayToken}
                    </Text>
                </Flex>
                <Flex justifyContent="space-between" w="full">
                    <Text fontSize="lg" color="gray.800">
                        Collateral Receive:
                    </Text>
                    <Text fontSize="lg" color="gray.800" textAlign="right">
                        {formatCollateralNumber(
                            Number(activeLiquidation?.collateralAmount)
                        )}{" "}
                        {collateralToken}
                    </Text>
                </Flex>
            </VStack>
        </CustomModal>
    );
};

export default LiquidateModal;
