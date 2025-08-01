"use client";

import { ModeToggle } from "@/components/ui/mode-toggle";
import type React from "react";
import { UserDropdown } from "@/components/UserDropdown";

import { WorkbenchStatus } from "@/components/WorkbenchStatus";

export default function WorkbenchLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col h-screen">
            <header className="border-b px-4 py-3 flex items-center justify-between h-[6vh]">
                <div className="flex items-center gap-4">
                    <img
                        src="/images/NSF.png"
                        alt="NSF Logo"
                        className="h-8"
                    />
                    <img
                        src="/images/NDIF.png"
                        alt="NDIF Logo"
                        className="h-8"
                    />
                </div>

                <nav className="flex gap-2 items-center">
                    <WorkbenchStatus />
                    <ModeToggle /> 
                    <UserDropdown />
                </nav>
            </header>
            {children}
        </div>
    );
}
