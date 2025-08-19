/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PUT(req: Request, ctx: any) {
    const raw = ctx?.params;
    const { id: projectId } =
        (typeof raw?.then === "function" ? await raw : raw) ?? {};

    if (!projectId) {
        return NextResponse.json({ error: "Missing :id" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await req.json();

    const { error } = await supabase
        .from("project")
        .update({ title })
        .eq("owner_id", session.user.id)
        .eq("id", projectId);

    if (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}



export async function DELETE(_req: Request, ctx: any) {
    const raw = ctx?.params;
    const { id: projectId } =
        (typeof raw?.then === "function" ? await raw : raw) ?? {};

    if (!projectId) {
        return NextResponse.json({ error: "Missing :id" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
        .from("project")
        .delete()
        .eq("owner_id", session.user.id)
        .eq("id", projectId);

    if (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function GET(_req: Request, ctx: any) {
    const raw = ctx?.params;
    const { id: projectId } = (typeof raw?.then === "function" ? await raw : raw) ?? {};

    if (!projectId) {
        return NextResponse.json({ error: "Missing :id" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project, error } = await supabase
        .from("project")
        .select("*")
        .eq("id", projectId)
        .eq("owner_id", session.user.id)
        .single();

    if (error || !project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
}

