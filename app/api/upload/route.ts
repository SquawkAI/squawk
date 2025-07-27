import type { NextRequest } from 'next/server'

import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const projectId = formData.get("projectId");
  const files = formData.getAll("file");

  if (!projectId || files.length === 0) {
    return new Response(JSON.stringify({ error: "Missing projectId or files" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error: insertError } = await supabase.from("files").insert({
      name: file.name,
      size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      project_id: projectId as string,
    }).select().single();

    if (!data || insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    uploadedPaths.push({
      id: data.id,
      name: data.name,
      size: data.size,
      mime_type: data.mime_type,
      storage_path: data.storage_path,
      createdAt: data.created_at,
      project_id: data.project_id,
    });
  }

  return new Response(JSON.stringify({ messsage: 'success', paths: uploadedPaths }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};