import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import AuthSessionProvider from "@/components/AuthSessionProvider";

interface ProjectPageProps {
    children: React.ReactNode;
    params: { id: string };
}

export default async function Layout({ children, params }: ProjectPageProps) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
        redirect("/signin");
    }

    const { data: project, error } = await supabase
        .from('project')
        .select('*')
        .eq('id', params.id)
        .eq('owner_id', userId)
        .single();

    if (error || !project) {
        redirect("/signin");
    }

    return (
        // OLD SIDEBAR LAYOUT
        // <>
        // { children }
        // </>
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-grow h-screen flex flex-col p-4 sm:p-6 lg:p-8 pb-0">
                <div className="flex md:hidden mb-4">
                    <SidebarTrigger />
                </div>
                <AuthSessionProvider>
                    <div className="flex-1">{children}</div>
                </AuthSessionProvider>
            </main>
        </SidebarProvider>
    );
}