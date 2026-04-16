"use client";

import { AppShell } from "@/components/AppShell";
import { Box } from "@chakra-ui/react";
import { Liquidation } from "@/components/Liquidation";

export default function LiquidationPage() {
    return (
        <AppShell maxContentWidth="1600px">
            <Box w="full" maxW="1600px" mx="auto">
                <Liquidation />
            </Box>
        </AppShell>
    );
}
