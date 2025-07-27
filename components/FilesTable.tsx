"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import {
  FileText,
  Trash,
} from "@phosphor-icons/react";

interface FileItem {
  id: string;
  name: string;
  size?: number;
  mime_type?: string;
  created_at: string;
}
interface FilesTableProps {
  refreshTrigger?: number;
  projectId: string;
}

// fetcher that throws on HTTP error
const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(async (res) => {
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || res.statusText);
  return payload;
});

// hook to encapsulate SWR logic
function useFiles(projectId: string | null, refreshTrigger?: number) {
  const { data: session, status } = useSession();
  const isAuth = status === "authenticated" && !!session?.user?.id;

  const url = useMemo(() => {
    if (!isAuth || !projectId) return null;
    const params = new URLSearchParams({ projectId });

    return `/api/files?${params.toString()}`;
  }, [isAuth, projectId]);

  const { data, error, isValidating, mutate } = useSWR<{ files: FileItem[] }>(url, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
  }
  );

  // Allow parent component to trigger refresh
  useEffect(() => {
    if (url && refreshTrigger !== undefined) mutate();
  }, [url, refreshTrigger, mutate]);

  return {
    loading: status === "loading" || isValidating,
    error: error as Error | null,
    files: data?.files ?? [],
    refresh: mutate,
  };
}

// helper to humanize bytes
const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizes = ["Bytes", "KB", "MB", "GB"];
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};


export const FilesTable: React.FC<FilesTableProps> = ({ refreshTrigger, projectId }) => {
  const { loading, error, files, refresh } = useFiles(projectId, refreshTrigger);

  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (fileId: string, fileName: string) => {
      if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return;

      setDeletingFile(fileId);
      try {
        const res = await fetch(`/api/files/${fileId}`, {
          method: "DELETE",
          credentials: "include",
        });

        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Delete failed");

        setSuccessMsg(`"${fileName}" deleted`);
        setTimeout(() => setSuccessMsg(null), 3000);
        await refresh();
      } catch (err) {
        alert((err as Error).message);
      } finally {
        setDeletingFile(null);
      }
    },
    [refresh]
  );

  if (loading) return (
    <div className="bg-white border rounded-lg p-8 text-center">
      <p className="text-gray-500">Loading files...</p>
    </div>
  )

  if (error) return (
    <div className="bg-white border rounded-lg p-8 text-center">
      <p className="text-red-500 mb-4">Error: {error.message}</p>
      <button onClick={() => refresh()} className="text-blue-500 hover:underline">
        Try again
      </button>
    </div>
  )


  if (!files.length) return (
    <div className="bg-white border rounded-lg p-8 text-center">
      <FileText
        size={48}
        weight="regular"
        className="mx-auto mb-4 text-gray-400"
      />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">No files yet</h3>
      <p className="text-gray-500">Upload your first file to get started.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{successMsg}</p>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Size</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {files.map((file) => (
              <tr
                key={file.id}
                className={`hover:bg-gray-50 ${deletingFile === file.id ? "opacity-50" : ""
                  }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 max-w-md truncate">
                    <FileText size={20} className="text-gray-500 flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end items-center">
                    <button
                        onClick={() => handleDelete(file.id, file.name)}
                        disabled={deletingFile === file.id}
                        className="text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={`Delete ${file.name}`}
                    >
                        <Trash size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
