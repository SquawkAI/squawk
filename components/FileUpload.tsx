"use client";

import React, { useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CloudArrowUp } from "@phosphor-icons/react";

type UploadedFile = { name: string;[key: string]: unknown };

interface FileUploadProps {
  onUploadSuccess?: (file: UploadedFile) => void;
  folderId?: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess, folderId = null }) => {
  const { data: session, status } = useSession();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = () => {
    fileInputRef.current?.click();
  }

  const uploadFile = useCallback(async (file: File) => {
    if (!session) {
      setError("You must be signed in to upload files.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      formData.append('projectId', '7c70ac69-7673-4be6-9efb-ba04c399e9a3');
      formData.append("file", file);
      if (folderId) {
        formData.append("folderId", folderId);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Upload failed");

      onUploadSuccess?.(json.file as UploadedFile);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [session, folderId, onUploadSuccess]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    setDragOver(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      uploadFile(file);
    }
  };

  const onDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.type === "dragover") setDragOver(true);
    if (e.type === "dragleave") setDragOver(false);
  };

  const borderColor = dragOver ? "border-blue-400" : "border-gray-300";
  const iconColor = uploading ? "text-blue-500" : "text-gray-400";

  if (status === "loading") return null;

  return (
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} onChange={onChange} className="hidden" />

      <div
        className={`border-2 border-dashed ${borderColor} rounded-lg p-6 cursor-pointer hover:border-gray-400 transition-colors`}
        onClick={pickFile}
        onDrop={onDrop}
        onDragOver={onDrag}
        onDragLeave={onDrag}
      >
        <div className="flex items-center gap-4">
          <CloudArrowUp size={24} className={iconColor} />
          <div>
            <p className="font-medium">{uploading ? "Uploading..." : "Upload Files"}</p>
            <p className="text-sm text-gray-500">
              {uploading ? "Please wait while your file is uploaded" : "Click or drag & drop a file here"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};
