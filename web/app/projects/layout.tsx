import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuthSessionProvider from "@/components/AuthSessionProvider";

export interface IProject {
    id: string;
    title: string;
    description: string;
    updated_at: string;
}

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

                {/* <DashboardHeader selectedProject={selectedProject} /> */}

                <AuthSessionProvider>
                    <div className="flex-1">{children}</div>
                </AuthSessionProvider>
            </main>
        </SidebarProvider>
    );
}