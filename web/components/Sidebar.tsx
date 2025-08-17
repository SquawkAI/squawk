"use client"

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { BookOpenText, Chat, FileText, ShareNetwork, User } from "@phosphor-icons/react/dist/ssr";

export function AppSidebar() {
    const { id: projectId } = useParams();
    

    return (
        <Sidebar>
            {/* Logo */}
            <SidebarHeader>
                <div className="flex justify-center py-6">
                    <Link href="/">
                        <Image
                            src="/squawk-logo-small.png"
                            alt="SquawkAI Logo"
                            priority
                            width={64}
                            height={64}
                            className="w-18 h-auto"
                        />
                    </Link>
                </div>
            </SidebarHeader>

            {/* Menu */}
            <SidebarContent>
                <SidebarGroup>
                    {/* Selected: Sources */}
                    <div className="mt-4 flex flex-col space-y-6">
                        <Link
                            href="/sources"
                            className="
                                inline-flex flex-col items-center gap-1
                                px-3 py-2
                                bg-blue-50 text-blue-600
                                rounded-xl
                                "
                        >
                            <BookOpenText size={36} weight="regular" />
                            <span className="text-sm font-semibold leading-none">
                                Sources
                            </span>
                        </Link>

                        {/* Tone */}
                        <Link
                            href="/tone"
                            className="
                                inline-flex flex-col items-center gap-1
                                px-3 py-2
                                text-gray-600 hover:bg-gray-100
                                rounded-xl
                            "
                        >
                            <FileText size={36} weight="regular" />
                            <span className="text-sm leading-none">Tone</span>
                        </Link>

                        {/* Chat */}
                        <Link
                            href={`/chat/${projectId}`}
                            className="
                                inline-flex flex-col items-center gap-1
                                px-3 py-2
                                text-gray-600 hover:bg-gray-100
                                rounded-xl
                            "
                        >
                            <Chat size={36} weight="regular" />
                            <span className="text-sm leading-none">Chat</span>
                        </Link>

                        {/* Share */}
                        <Link
                            href="/share"
                            className="
                                inline-flex flex-col items-center gap-1
                                px-3 py-2
                                text-gray-600 hover:bg-gray-100
                                rounded-xl
                            "
                        >
                            <ShareNetwork size={36} weight="regular" />
                            <span className="text-sm leading-none">Share</span>
                        </Link>
                    </div>
                </SidebarGroup>
            </SidebarContent>

            {/* Profile icon pinned at bottom */}
            <SidebarFooter>
                <div className="mt-4 flex flex-col space-y-6">
                    <Link
                        href="/profile"
                        className="
                            inline-flex flex-col items-center gap-1
                            px-3 py-2
                            text-gray-600 hover:bg-gray-100
                            rounded-xl
                        "
                    >
                        <User size={36} weight="regular" />
                        <span className="text-sm leading-none">Profile</span>
                    </Link>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
