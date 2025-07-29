import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AuthSessionProvider from "@/components/AuthSessionProvider";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/signin");
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-grow h-screen flex flex-col p-4 sm:p-6 lg:p-8 pb-0">
                <div className="flex md:hidden mb-4">
                    <SidebarTrigger />
                </div>

                <header className="flex items-center justify-between gap-4 mb-12 flex-shrink-0">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">My New Project</h1>
                    <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-10">
                        <span className="text-base font-medium">My Projects</span>
                        <Button>+ New Project</Button>
                    </div>
                </header>

                <AuthSessionProvider>
                    <div className="flex-1 overflow-hidden">{children}</div>
                </AuthSessionProvider>
            </main>
        </SidebarProvider>
    );
}