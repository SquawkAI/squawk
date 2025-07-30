import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import axios from "axios";

import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  const projectId = formData.get("projectId");
  const files = formData.getAll("file");

  if (!projectId || files.length === 0) {
    return NextResponse.json({ error: "Missing projectId or files" }, { status: 400 });
  }

  const uploadedPaths = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const storagePath = `${projectId}/${file.name}`;

    const { error } = await supabase.storage
      .from("user-uploads")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data, error: insertError } = await supabase.from("files").upsert({
      name: file.name,
      size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      project_id: projectId as string,
    }).select().single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const embeddingUrl = process.env.EMBEDDING_SERVICE_URL || "http://localhost:8000";
    const formData = new FormData();
    formData.append("file_id", data.id);
    formData.append("file", file);

    axios.post(`${embeddingUrl}/`, formData)
      .catch((err) => {
        console.error("Background chunking + embedding request failed:", err);
      });

    uploadedPaths.push({
      id: data.id,
      name: data.name,
      size: data.size,
      mime_type: data.mime_type,
      storage_path: data.storage_path,
      createdAt: data.created_at,
      project_id: data.project_id,
      status: "processing"
    });
  }

  return NextResponse.json({ messsage: 'success', paths: uploadedPaths }, { status: 200 });
};