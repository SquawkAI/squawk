import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AuthSessionProvider from "@/components/AuthSessionProvider";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";

import DashboardHeader from "@/components/DashboardHeader";

export interface IProject {
    id: string;
    name: string
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/signin");
    }

    const project = {
        id: '7c70ac69-7673-4be6-9efb-ba04c399e9a3',
        name: 'My new project'
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-grow h-screen flex flex-col p-4 sm:p-6 lg:p-8 pb-0">
                <div className="flex md:hidden mb-4">
                    <SidebarTrigger />
                </div>

                <DashboardHeader project={project} />

                <AuthSessionProvider>
                    <div className="flex-1 overflow-hidden">{children}</div>
                </AuthSessionProvider>
            </main>
        </SidebarProvider>
    );
}