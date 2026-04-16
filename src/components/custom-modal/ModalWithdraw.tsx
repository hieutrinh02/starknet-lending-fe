import { useAtom } from "jotai";
import { useState } from "react";
import {
    HStack,
    VStack,
    Box,
    Input,
    Button,
    Text,
    Link,
    useToast,
} from "@chakra-ui/react";
import CustomModal from ".";
import {
    activePoolAtom,
    activeSupplyAtom,
    lpAmountWithdrawAtom,
    modalStateAtom,
} from "@/state";
import useStarknet from "@/services/invokeContract";
import { formatUnits } from "@/utils";

const WithdrawModal = () => {
    const [loading, setLoading] = useState(false);
    const [modalState, setModalState] = useAtom(modalStateAtom);
    const [activePool] = useAtom(activePoolAtom);
    const [activeSupply] = useAtom(activeSupplyAtom);
    const [lpAmountWithdraw, setLpAmountWithdraw] = useAtom(lpAmountWithdrawAtom);
    const { handleWithdraw } = useStarknet();
    const toast = useToast();

    const poolLabel = activePool?.pool ?? activeSupply?.pool ?? "";
    const [supplyToken] = poolLabel.split("/");
    const supplyTokenAddr = activeSupply?.tokenAddress ?? activePool?.tokenAddress;
    const collateralTokenAddr =
        activeSupply?.collateralTokenAddress ?? activePool?.collateralTokenAddress;

    const handleMaxClick = () => {
        setLpAmountWithdraw(
            activeSupply?.lpOwned
                ? formatUnits(activeSupply.lpOwned, 18, { trimTrailingZeros: true })
                : "0"
        );
    };

    const handleConfirm = async () => {
        if (!supplyTokenAddr || !collateralTokenAddr) return;

        try {
            setLoading(true);
            let res = await handleWithdraw({
                tokenAddr: supplyTokenAddr,
                collateralAddr: collateralTokenAddr,
                lpAmountWithdraw: lpAmountWithdraw,
            });
            if (res.transaction_hash) {
                setLoading(false);
                toast({
                    title: "Withdraw Successful",
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

    if (!modalState.isOpen || modalState.type !== "Withdraw" || !activeSupply) {
        return null;
    }

    return (
        <CustomModal
            title={
                <HStack spacing="2.5" align="center">
                    <Box as="span">{`Withdraw ${supplyToken}`}</Box>
                </HStack>
            }
            isOpen={modalState.isOpen}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            loading={loading}
        >
            <VStack spacing="6" p="4">
                <Text fontSize="lg" fontWeight="bold">
                    Enter the amount of LP Token to burn:
                </Text>
                <HStack spacing="2" w="full">
                    <Input
                        placeholder="Enter amount"
                        value={lpAmountWithdraw}
                        onChange={(e) => setLpAmountWithdraw(e.target.value)}
                        variant="filled"
                        focusBorderColor="gray.900"
                    />
                    <Button
                        onClick={handleMaxClick}
                        bg="gray.900"
                        color="white"
                        _hover={{ bg: "black" }}
                        _active={{ bg: "black" }}
                    >
                        Max
                    </Button>
                </HStack>
            </VStack>
        </CustomModal>
    );
};

export default WithdrawModal;
