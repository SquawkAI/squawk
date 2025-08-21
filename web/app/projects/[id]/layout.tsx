// app/projects/[id]/layout.tsx
import { type ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect /* or notFound */ } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AuthSessionProvider from "@/components/AuthSessionProvider";

export default async function Layout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
        redirect("/signin"); // or notFound()
    }

    const { data: project, error } = await supabase
        .from("project")
        .select("id")
        .eq("id", id)
        .eq("owner_id", userId)
        .single();

    if (error || !project) {
        redirect("/signin");
    }

    return (
        <SidebarProvider>
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
