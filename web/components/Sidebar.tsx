"use client"

import { useParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { BookOpenText, FadersHorizontalIcon, Folders, ShareNetwork, User } from "@phosphor-icons/react/dist/ssr";

export function AppSidebar() {
    const { id: projectId } = useParams();
    const pathname = usePathname();

    const isActive = (href: string) => {
        // Exact match or startsWith for subpages
        if (href === `/projects/${projectId}`) {
            return pathname === `/projects/${projectId}`;
        }
        return pathname.startsWith(href);
    };

    return (
        <Sidebar>
            {/* Logo */}
            <SidebarHeader>
                <div className="flex justify-center py-6">
                    <Link href="/">
                        <Image
                            src="/squawk.svg"
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
                {pathname === "/projects" ? <SidebarGroup>
                    {/* Selected: Sources */}
                    <div className="mt-4 flex flex-col items-center gap-4">
                        <Link
                            href={`/projects/${projectId}`}
                            className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-xl w-28 justify-center ${isActive(`/projects`) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
                        >
                            <Folders size={36} weight="regular" />
                            <span className="text-sm leading-none">Projects</span>
                        </Link>
                    </div>
                </SidebarGroup> : <SidebarGroup>
                    {/* Selected: Sources */}
                    <div className="mt-4 flex flex-col items-center gap-4">
                        <Link
                            href={`/projects/${projectId}`}
                            className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-xl w-28 justify-center ${isActive(`/projects/${projectId}`) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
                        >
                            <BookOpenText size={36} weight="regular" />
                            <span className="text-sm leading-none">Sources</span>
                        </Link>
                        {/* Configure */}
                        <Link
                            href={`/projects/${projectId}/config`}
                            className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-xl w-28 justify-center ${isActive(`/projects/${projectId}/config`) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
                        >
                            <FadersHorizontalIcon size={36} weight="regular" />
                            <span className="text-sm leading-none">Configure</span>
                        </Link>
                        {/* Share */}
                        <Link
                            href={`/projects/${projectId}/share`}
                            className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-xl w-28 justify-center ${isActive(`/projects/${projectId}/share`) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
                        >
                            <ShareNetwork size={36} weight="regular" />
                            <span className="text-sm leading-none">Share</span>
                        </Link>
                    </div>
                </SidebarGroup>}
            </SidebarContent>

            {/* Profile icon pinned at bottom */}
            {/* <SidebarFooter>
                <div className="mt-4 flex flex-col space-y-6">
                    <Link
                        href="/profile"
                        className="inline-flex flex-col items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                    >
                        <User size={36} weight="regular" />
                        <span className="text-sm leading-none">Profile</span>
                    </Link>
                </div>
            </SidebarFooter> */}
        </Sidebar>
    );
}