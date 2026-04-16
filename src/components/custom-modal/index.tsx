import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Button
} from "@chakra-ui/react";
import React from "react";

interface ICustomModalProps {
    title: React.ReactNode;
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    loading?: boolean;
    children: React.ReactNode;
    cancelText?: string;
    confirmText?: string;
}

const CustomModal: React.FC<ICustomModalProps> = ({
    title,
    isOpen,
    onCancel,
    onConfirm,
    children,
    loading = false,
}: ICustomModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{title}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>{children}</ModalBody>
                <ModalFooter>
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        bg="gray.900"
                        color="white"
                        _hover={{ bg: "black" }}
                        _active={{ bg: "black" }}
                        onClick={onConfirm}
                        isLoading={loading}
                    >
                        Confirm
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CustomModal;
