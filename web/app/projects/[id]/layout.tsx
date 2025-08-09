import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
        <>
        { children }
        </>
    )
}