/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/files/[id]/retry/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(_req: Request, ctx: any) {
    // params may be a Promise
    const raw = ctx?.params;
    const { id: fileId } = (typeof raw?.then === "function" ? await raw : raw) ?? {};

    if (!fileId) {
        return NextResponse.json({ error: "Missing :id" }, { status: 400 });
    }

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch file metadata
        const { data: fileRecord, error: fetchError } = await supabase
            .from("files")
            .select("id, name, storage_path, project!inner(id, owner_id)")
            .eq("id", fileId)
            .eq("project.owner_id", session.user.id)
            .single();

        if (fetchError || !fileRecord) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Update status → processing
        const { error: statusUpdateError } = await supabase
            .from("files")
            .update({ status: "processing" })
            .eq("id", fileId);

        if (statusUpdateError) {
            return NextResponse.json(
                { error: "Failed to update file status" },
                { status: 500 }
            );
        }

        // Download the file
        const { data: fileBlob, error: downloadError } = await supabase.storage
            .from("user-uploads")
            .download(fileRecord.storage_path);

        if (downloadError || !fileBlob) {
            await supabase.from("files").update({ status: "error" }).eq("id", fileId);
            return NextResponse.json({ error: "File not found" }, { status: 500 });
        }

        const embeddingUrl = process.env.EMBEDDING_SERVICE_URL;
        if (!embeddingUrl) {
            await supabase.from("files").update({ status: "error" }).eq("id", fileId);
            return NextResponse.json(
                { error: "Embedding service URL not configured" },
                { status: 500 }
            );
        }

        // Fire-and-forget embedding request
        (async () => {
            try {
                const fd = new FormData();
                fd.append("file_id", fileId);
                fd.append("file", fileBlob, fileRecord.name);

                const resp = await fetch(embeddingUrl, { method: "POST", body: fd });
                if (!resp.ok) {
                    await supabase.from("files").update({ status: "error" }).eq("id", fileId);
                    console.error("Embedding service non-200:", resp.status);
                }
            } catch (e) {
                await supabase.from("files").update({ status: "error" }).eq("id", fileId);
                console.error("Embedding request failed:", e);
            }
        })();

        return NextResponse.json({ message: "Embedding started" });
    } catch (error) {
        console.error("Retry error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
