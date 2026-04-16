"use client";

import { AppShell } from "@/components/AppShell";
import { Box } from "@chakra-ui/react";
import { Dashboard } from "@/components/Dashboard";

export default function DashboardPage() {
    return (
        <AppShell maxContentWidth="1600px">
            <Box w="full" maxW="1600px" mx="auto">
                <Dashboard />
            </Box>
        </AppShell>
    );
}
