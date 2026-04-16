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
import { activeBorrowAtom, modalStateAtom } from "@/state";
import useStarknet from "@/services/invokeContract";
import { formatUnits, formatUserBorrowNumber, formatInterestNumber } from "@/utils";

const RepayModal = () => {
    const [loading, setLoading] = useState(false);
    const [modalState, setModalState] = useAtom(modalStateAtom);
    const [activeBorrow] = useAtom(activeBorrowAtom);
    const { handleRepay } = useStarknet();
    const toast = useToast();

    const [repayToken, collateralToken] = activeBorrow?.pool
        ? activeBorrow.pool.split("/")
        : ["", ""];
    const repayTokenAddr = activeBorrow?.tokenAddress;
    const collateralTokenAddr = activeBorrow?.collateralTokenAddress;
    const borrowId = activeBorrow?.borrowId;

    const handleConfirm = async () => {
        if (!repayTokenAddr || !collateralTokenAddr || borrowId === undefined) {
            return;
        }

        try {
            setLoading(true);
            const totalRepayAmount = formatUnits(
                BigInt(activeBorrow.borrowAmount) + BigInt(activeBorrow.interest),
                18,
                { trimTrailingZeros: true }
            );
            let res = await handleRepay({
                repayTokenAddr: repayTokenAddr,
                collateralAddr: collateralTokenAddr,
                borrowId: borrowId,
                totalRepayAmount,
            });
            if (res.transaction_hash) {
                setLoading(false);
                toast({
                    title: "Repay Successful",
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

    if (!modalState.isOpen || modalState.type !== "Repay" || !activeBorrow) {
        return null;
    }

    return (
        <CustomModal
            title={
                <HStack spacing="2.5" align="center">
                    <Box as="span">{`Repay ${repayToken}`}</Box>
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
                        {formatUserBorrowNumber(Number(activeBorrow?.borrowAmount))}{" "}
                        {repayToken}
                    </Text>
                </Flex>
                <Flex justifyContent="space-between" w="full">
                    <Text fontSize="lg" color="gray.800">
                        Interest Amount:
                    </Text>
                    <Text fontSize="lg" color="gray.800" textAlign="right">
                        {formatInterestNumber(Number(activeBorrow?.interest))} {repayToken}
                    </Text>
                </Flex>
                <Flex justifyContent="space-between" w="full">
                    <Text fontSize="lg" color="gray.800">
                        Total Loan:
                    </Text>
                    <Text fontSize="lg" color="gray.800" textAlign="right">
                        {formatUserBorrowNumber(
                            Number(activeBorrow?.borrowAmount) +
                            Number(activeBorrow?.interest)
                        )}{" "}
                        {repayToken}
                    </Text>
                </Flex>
            </VStack>
        </CustomModal>
    );
};

export default RepayModal;
