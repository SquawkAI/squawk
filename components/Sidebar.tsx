import Image from "next/image";
import Link from "next/link";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { FileText, MessageSquareText, Share2, User } from "lucide-react";

export function AppSidebar() {
    return (
        <Sidebar>
            {/* Logo */}
            <SidebarHeader>
                <div className="flex justify-center py-6">
                    <Image
                        src="/squawk-logo-small.png"
                        alt="SquawkAI Logo"
                        priority
                        width={64}
                        height={64}
                        className="w-18 h-auto"
                    />
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
                            <FileText strokeWidth={1.5} size={36} />
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
                            <MessageSquareText strokeWidth={1.5} size={36} />
                            <span className="text-sm leading-none">Tone</span>
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
                            <Share2 strokeWidth={1.5} size={36} />
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
                        <User strokeWidth={1.5} size={36} />
                        <span className="text-sm leading-none">Profile</span>
                    </Link>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
