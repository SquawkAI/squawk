import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import axios from "axios";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: fileId } = await params;

        // Fetch file metadata
        const { data: fileRecord, error: fetchError } = await supabase
            .from("files")
            .select("*")
            .eq("id", fileId)
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
            return NextResponse.json({ error: "File not found" }, { status: 500 });
        }

        const embeddingUrl = process.env.EMBEDDING_SERVICE_URL || "http://localhost:8000";
        const formData = new FormData();
        formData.append("file_id", fileId);
        formData.append("file", fileBlob, fileRecord.name);

        axios.post(`${embeddingUrl}/`, formData)
            .catch((err) => {
                console.error("Background chunking + embedding request failed:", err);
            });


        return NextResponse.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
