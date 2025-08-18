'use client';
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
                    <div className="mt-4 flex flex-col space-y-6">
                        <Link
                            href="/dashboard"
                            className={linkStyle("/dashboard")}
                        >
                            <BookOpenText size={36} weight="regular" />
                            <span className={`text-sm leading-none ${isActive("/dashboard") ? "font-semibold" : ""}`}>
                                Sources
                            </span>
                        </Link>

                        {/* Tone */}
                        <Link
                            href="/dashboard/tone"
                            className={linkStyle("/dashboard/tone")}
                        >
                            <FileText size={36} weight="regular" />
                            <span className={`text-sm leading-none ${isActive("/dashboard/tone") ? "font-semibold" : ""}`}>
                                Tone
                            </span>
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
                            href="/dashboard/share"
                            className={linkStyle("/dashboard/share")}
                        >
                            <ShareNetwork size={36} weight="regular" />
                            <span className={`text-sm leading-none ${isActive("/dashboard/share") ? "font-semibold" : ""}`}>
                                Share
                            </span>
                        </Link>
                    </div>
                </SidebarGroup>
            </SidebarContent>

            {/* Profile icon pinned at bottom */}
            <SidebarFooter>
                <div className="mt-4 flex flex-col space-y-6">
                    <Link
                        href="/dashboard/profile"
                        className={linkStyle("/dashboard/profile")}
                    >
                        <User size={36} weight="regular" />
                        <span className={`text-sm leading-none ${isActive("/dashboard/profile") ? "font-semibold" : ""}`}>
                            Profile
                        </span>
                    </Link>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}