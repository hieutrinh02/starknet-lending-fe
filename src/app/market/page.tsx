"use client";

import { AppShell } from "@/components/AppShell";
import { MarketDashboard } from "@/components/MarketDashboard";
import { Box } from "@chakra-ui/react";

export default function MarketPage() {
    return (
        <AppShell maxContentWidth="1600px">
            <Box w="full" maxW="1600px" mx="auto">
                <MarketDashboard />
            </Box>
        </AppShell>
    );
}
