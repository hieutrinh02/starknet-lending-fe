import { useAtom } from "jotai";
import {
    HStack,
    VStack,
    Input,
    Box,
    Text,
    InputGroup,
    InputRightElement,
    Link,
    useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import CustomModal from ".";
import {
    activePoolAtom,
    amountAtom,
    modalStateAtom,
} from "@/state";
import useStarknet from "@/services/invokeContract";

const SupplyModal = () => {
    const [loading, setLoading] = useState(false);
    const [modalState, setModalState] = useAtom(modalStateAtom);
    const [activePool] = useAtom(activePoolAtom);
    const [amount, setAmount] = useAtom(amountAtom);
    const { handleSupply } = useStarknet();
    const toast = useToast();

    const poolLabel = activePool?.pool ?? "";
    const [supplyToken] = poolLabel.split("/");
    const supplyTokenAddr = activePool?.tokenAddress;
    const collateralTokenAddr = activePool?.collateralTokenAddress;

    const handleConfirm = async () => {
        if (!supplyTokenAddr || !collateralTokenAddr) return;

        try {
            setLoading(true);
            let res = await handleSupply({
                tokenAddr: supplyTokenAddr,
                collateralAddr: collateralTokenAddr,
                supplyAmount: amount,
            });
            if (res.transaction_hash) {
                setLoading(false);
                toast({
                    title: "Supply Successful",
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

    if (!modalState.isOpen || modalState.type !== "Supply" || !activePool) {
        return null;
    }

    return (
        <CustomModal
            title={
                <HStack spacing="2.5" align="center">
                    <Box as="span">{`Supply ${supplyToken}`}</Box>
                </HStack>
            }
            isOpen={modalState.isOpen}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            loading={loading}
        >
            <VStack spacing="6" p="4">
                <Text fontSize="lg" fontWeight="bold">
                    Enter the amount you want to supply:
                </Text>
                <InputGroup size="lg">
                    <Input
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        variant="filled"
                        focusBorderColor="gray.900"
                        pr="6.5rem"
                    />
                    <InputRightElement
                        width="6rem"
                        h="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Text fontWeight="medium" color="gray.700" lineHeight="1">
                            {supplyToken}
                        </Text>
                    </InputRightElement>
                </InputGroup>
            </VStack>
        </CustomModal>
    );
};

export default SupplyModal;
