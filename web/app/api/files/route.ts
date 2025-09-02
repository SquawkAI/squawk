import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

import { mintEmbeddingToken } from "@/lib/security";

export async function GET(req: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const { data, error } = await supabase
    .from("files")
    .select("*, project!inner(id)")
    .eq("project.id", projectId)
    .eq("project.owner_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ files: data });
}

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

  const { data: project, error: projectError } = await supabase
    .from("project")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", session.user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
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

    if (insertError || !data) {
      // rollback storage object to avoid orphans
      await supabase.storage.from("user-uploads").remove([storagePath]).catch(() => { });
      return NextResponse.json({ error: "Failed to register file metadata" }, { status: 500 });
    }

    const embeddingUrl = process.env.EMBEDDING_SERVICE_URL

    let token: string;
    try {
      token = await mintEmbeddingToken(session.user.id);
    } catch (e: unknown) {
      // roll back status so UI can retry
      await supabase.from("files").update({ status: "error" }).eq("id", data.id);
      return NextResponse.json({ error: `Token mint failed: ${(e as Error)?.message || e}` }, { status: 500 });
    }

    const formData = new FormData();
    formData.append("file_id", data.id);
    formData.append("file", file);

    fetch(`${embeddingUrl}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

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
