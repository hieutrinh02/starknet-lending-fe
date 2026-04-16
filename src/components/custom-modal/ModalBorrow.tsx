import { useAtom } from "jotai";
import {
    HStack,
    VStack,
    Box,
    Input,
    InputGroup,
    InputRightElement,
    Link,
    Text,
    useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import CustomModal from ".";
import {
    DISPLAYED_MINIMUM_COLLATERAL_OFFSET,
    DISPLAYED_MINIMUM_COLLATERAL_SCALE,
    LIQUIDATION_THRESHOLD_DENOMINATOR,
    LIQUIDATION_THRESHOLD_NUMERATOR,
    MAX_LTV_DENOMINATOR,
    MAX_LTV_NUMERATOR,
    TOKEN_DECIMALS_BIGINT,
} from "@/constants";
import {
    activePoolAtom,
    amountAtom,
    collateralAmountAtom,
    modalStateAtom,
    tokenPriceDataAtom,
} from "@/state";
import useStarknet from "@/services/invokeContract";
import { formatScaledDecimal, parseUnits } from "@/utils";

const BorrowModal = () => {
    const [loading, setLoading] = useState(false);
    const [modalState, setModalState] = useAtom(modalStateAtom);
    const [activePool] = useAtom(activePoolAtom);
    const [amount, setAmount] = useAtom(amountAtom);
    const [collateralAmount, setCollateralAmount] = useAtom(collateralAmountAtom);
    const [tokenPriceData, _] = useAtom(tokenPriceDataAtom);
    const { handleBorrow } = useStarknet();
    const toast = useToast();

    const poolLabel = activePool?.pool ?? "";
    const [borrowToken, collateralToken] = poolLabel.split("/");
    const borrowTokenAddr = activePool?.tokenAddress;
    const collateralTokenAddr = activePool?.collateralTokenAddress;

    const borrowTokenPrice =
        (borrowTokenAddr && tokenPriceData[borrowTokenAddr.toLowerCase()]) ||
        BigInt(0);
    const collateralTokenPrice =
        (collateralTokenAddr &&
            tokenPriceData[collateralTokenAddr.toLowerCase()]) ||
        BigInt(0);

    const displayedMinimumCollateral = amount
        ? (() => {
            const borrowAmount = parseUnits(amount, 18).value;
            const effectiveCollateralPrice =
                collateralTokenPrice === BigInt(0) ? BigInt(1) : collateralTokenPrice;

            const minimumCollateral =
                borrowAmount *
                borrowTokenPrice *
                LIQUIDATION_THRESHOLD_NUMERATOR *
                MAX_LTV_DENOMINATOR /
                effectiveCollateralPrice /
                LIQUIDATION_THRESHOLD_DENOMINATOR /
                MAX_LTV_NUMERATOR;

            const minimumCollateralDisplayScaled =
                (minimumCollateral * DISPLAYED_MINIMUM_COLLATERAL_SCALE +
                    TOKEN_DECIMALS_BIGINT -
                    BigInt(1)) /
                TOKEN_DECIMALS_BIGINT;

            return formatScaledDecimal(
                minimumCollateralDisplayScaled,
                DISPLAYED_MINIMUM_COLLATERAL_SCALE
            );
        })()
        : Number(0).toFixed(DISPLAYED_MINIMUM_COLLATERAL_OFFSET);

    const handleConfirm = async () => {
        if (!borrowTokenAddr || !collateralTokenAddr) return;

        try {
            setLoading(true);
            let res = await handleBorrow({
                tokenAddr: borrowTokenAddr,
                borrowAmount: amount,
                collateralAddr: collateralTokenAddr,
                collateralAmount: collateralAmount,
            });
            if (res.transaction_hash) {
                setLoading(false);
                toast({
                    title: "Borrow Successful",
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

    if (!modalState.isOpen || modalState.type !== "Borrow" || !activePool) {
        return null;
    }

    return (
        <CustomModal
            title={
                <HStack spacing="2.5" align="center">
                    <Box as="span">{`Borrow ${borrowToken}`}</Box>
                </HStack>
            }
            isOpen={modalState.isOpen}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            loading={loading}
        >
            <VStack spacing="6" p="4">
                <Text fontSize="lg" fontWeight="bold">
                    Enter the amount you want to borrow:
                </Text>
                <InputGroup size="lg">
                    <Input
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        variant="filled"
                        size="lg"
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
                            {borrowToken}
                        </Text>
                    </InputRightElement>
                </InputGroup>
                <Text fontSize="lg" fontWeight="bold">
                    Enter the collateral amount:
                </Text>
                <InputGroup size="lg">
                    <Input
                        placeholder="Enter amount"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                        variant="filled"
                        size="lg"
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
                            {collateralToken}
                        </Text>
                    </InputRightElement>
                </InputGroup>
                <Text fontSize="sm" color="red.500">
                    Minimum collateral required: {displayedMinimumCollateral}{" "}
                    {collateralToken}
                </Text>
            </VStack>
        </CustomModal>
    );
};

export default BorrowModal;
