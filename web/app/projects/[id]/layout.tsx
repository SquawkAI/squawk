// app/projects/[id]/layout.tsx
import { type ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect /* or notFound */ } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
       <>
        { children }
        </>
    );
}
