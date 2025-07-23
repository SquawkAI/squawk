import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/Sidebar";

import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-grow p-4 sm:p-6 lg:p-8">
                <div className="flex md:hidden mb-4">
                    <SidebarTrigger />
                </div>

                <header className=" flex items-center justify-between gap-4 mb-12">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                        My New Project
                    </h1>

                    <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-10">
                        <span className="text-base font-medium">My Projects</span>
                        <Button>+ New Project</Button>
                    </div>
                </header>

                <div>
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}


