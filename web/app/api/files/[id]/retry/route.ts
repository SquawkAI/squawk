import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: fileId } = params;

        // Fetch file metadata
        const { data: fileRecord, error: fetchError } = await supabase
            .from("files")
            .select("id, name, storage_path, project!inner(id, owner_id)")
            .eq("id", fileId)
            .eq("project.owner_id", session.user.id)
            .single();

        if (fetchError || !fileRecord) {
            return NextResponse.json({ error: "File not found" }, { status: 404 }
            );
        }

        const { error: statusUpdateError } = await supabase
            .from("files")
            .update({ status: "processing" })
            .eq("id", fileId);

        if (statusUpdateError) {
            return NextResponse.json({ error: "Failed to update file status" }, { status: 500 });
        }

        const { data: fileBlob, error: downloadError } = await supabase.storage
            .from("user-uploads")
            .download(fileRecord.storage_path);

        if (downloadError || !fileBlob) {
            await supabase.from("files").update({ status: "error" }).eq("id", fileId);
            return NextResponse.json({ error: "File not found" }, { status: 500 });
        }

        (async () => {
            try {
                const embeddingUrl = process.env.EMBEDDING_SERVICE_URL

                const fd = new FormData();
                fd.append("file_id", fileId);
                fd.append("file", fileBlob, fileRecord.name);

                const resp = await fetch(`${embeddingUrl}/`, { method: "POST", body: fd });
                if (!resp.ok) {
                    // mark error so UI can retry
                    await supabase.from("files").update({ status: "error" }).eq("id", fileId);
                    console.error("Embedding service returned non-200:", resp.status);
                }
            } catch (e) {
                await supabase.from("files").update({ status: "error" }).eq("id", fileId);
                console.error("Background embedding request failed:", e);
            }
        })();


        return NextResponse.json({ message: "Embedding started" });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
