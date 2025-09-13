"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import {
  FileText,
  Trash,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { IFileItem } from "@/app/projects/[id]/page";

interface FilesTableProps {
  refreshTrigger?: number;
  projectId: string;
  searchTerm?: string;

  selectedDoc: IFileItem | null
  setSelectedDoc: React.Dispatch<React.SetStateAction<IFileItem | null>>
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

  const { data, error, mutate } = useSWR<{ files: IFileItem[] }>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
      keepPreviousData: true,
    }
  );

  const isInitialLoading = status === "loading" || (!!url && data === undefined && !error);

  // Allow parent component to trigger refresh
  useEffect(() => {
    if (url && refreshTrigger !== undefined) mutate();
  }, [url, refreshTrigger, mutate]);

  // Subscribe to status updates
  // Update the status of a file when its done processing
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel("files-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "files",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const updatedFile = payload.new;

          // update the cache manually
          mutate((currentData) => {
            if (!currentData) return currentData;

            return {
              ...currentData,
              files: currentData.files.map((file) =>
                file.id === updatedFile.id ? { ...file, ...updatedFile } : file
              ),
            };
          }, false); // `false` to avoid revalidation
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, mutate]);

  return {
    loading: isInitialLoading,
    error: error as Error | null,
    files: data?.files ?? [],
    refresh: mutate,
    mutateFiles: mutate,
  };
}

// helper to humanize bytes
const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizes = ["Bytes", "KB", "MB", "GB"];
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// small gluable UI parts
const LoadingState = () => (
  <div className="bg-background border border-border rounded-lg p-8 text-center">
    <p className="text-muted-foreground">Loading files...</p>
  </div>
);

const SWRErrorState = ({ message, onRetry }: { message: string; onRetry: () => void; }) => (
  <div className="bg-background border border-border rounded-lg p-8 text-center">
    <p className="text-destructive mb-4">Error: {message}</p>
    <div className="space-x-2">
      <button onClick={onRetry} className="text-primary hover:underline">
        Try again
      </button>
    </div>
  </div>
);

const EmptyState = ({ isSearching }: { isSearching?: boolean }) => (
  <div className="bg-background border border-border rounded-lg p-8 text-center">
    <FileText
      size={48}
      weight="regular"
      className="mx-auto mb-4 text-muted-foreground"
    />
    <h3 className="text-lg font-semibold text-foreground mb-2">
      {isSearching ? "No files found" : "No files yet"}
    </h3>
    <p className="text-muted-foreground">
      {isSearching
        ? "No files match your search. Try adjusting your search terms."
        : "Upload your first file to get started."
      }
    </p>
  </div>
);

export const FilesTable: React.FC<FilesTableProps> = ({ refreshTrigger, projectId, searchTerm = "", selectedDoc, setSelectedDoc }) => {
  const { loading, error: swrError, files, refresh, mutateFiles } = useFiles(projectId, refreshTrigger);
  const [error, setError] = useState<Error | null>(null);

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return files;

    return files.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [files, searchTerm]);

  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const handleRetry = useCallback(
    async (fileId: string) => {
      setDeletingFile(fileId);

      try {
        await mutateFiles(
          // Perform the server mutation mutate
          async (current) => {
            const res = await fetch(`/api/files/${fileId}/retry`, {
              method: "POST",
              credentials: "include",
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || "Retry failed");

            // Return the new cache value (same as optimisticData)
            return {
              files: (current?.files ?? []).filter((f) => f.id !== fileId),
            };
          },

        );

        // Optional: verify with a silent background revalidate later
        // void refresh();
      } catch (err: unknown) {
        setError(err as Error);
        setTimeout(() => setError(null), 5000);
      } finally {
        setDeletingFile(null);
      }
    },
    [mutateFiles]
  )

  const handleDelete = useCallback(
    async (fileId: string, fileName: string) => {
      if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return;

      setDeletingFile(fileId);

      try {
        await mutateFiles(
          // Perform the server mutation mutate
          async (current) => {
            const res = await fetch(`/api/files/${fileId}`, {
              method: "DELETE",
              credentials: "include",
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || "Delete failed");

            // Return the new cache value (same as optimisticData)
            return {
              files: (current?.files ?? []).filter((f) => f.id !== fileId),
            };
          },
          {
            // Instantly update the UI
            optimisticData: (current) => ({
              files: (current?.files ?? []).filter((f) => f.id !== fileId),
            }),
            rollbackOnError: true,
            revalidate: false,
            populateCache: true,
          }
        );


        setSelectedDoc(null);

        // Optional: verify with a silent background revalidate later
        // void refresh();
      } catch (err: unknown) {
        setError(err as Error);
        setTimeout(() => setError(null), 5000);
      } finally {
        setDeletingFile(null);
      }
    },
    [mutateFiles]
  );

  if (loading) return <LoadingState />;
  if (swrError) return <SWRErrorState message={swrError.message} onRetry={refresh} />;
  if (!filteredFiles.length) {
    const isSearching = searchTerm.trim().length > 0;
    return <EmptyState isSearching={isSearching} />;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-border rounded-md">
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}

      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <table className="w-full divide-y divide-border table-fixed">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-foreground w-4/5">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-foreground w-1/5">Size</th>
              <th className="px-4 py-2 w-1/10" />
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {filteredFiles.map((file) => (
              <tr
                key={file.id}
                className={`hover:bg-muted cursor-pointer ${selectedDoc?.id === file.id ? "bg-primary/10 ring-1 ring-ring" : ""
                  } ${deletingFile === file.id ? "opacity-50" : ""}`}
                onClick={() => setSelectedDoc(file)}
              >

                <td className="px-4 py-3 flex items-center gap-2">
                  <FileText size={20} className="text-muted-foreground" />
                  <span className="truncate">{file.name}</span>

                  {file.status === "processing" && (
                    <span className="ml-2 flex items-center gap-1 text-xs text-primary font-medium">
                      <svg
                        className="animate-spin h-4 w-4 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                        />
                      </svg>
                      Processing...
                    </span>
                  )}

                  {file.status === "failed" && (
                    <span className="ml-2 flex items-center gap-1 text-xs text-destructive font-medium">
                      <svg
                        className="h-4 w-4 text-destructive"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"
                        />
                      </svg>
                      Failed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <span className="whitespace-nowrap">{formatFileSize(file.size)}</span>
                </td>
                <td className="px-4 py-3 min-w-[6rem]">
                  <div className="flex justify-end items-center gap-x-3">
                    {file.status === 'failed' && deletingFile !== file.id && (
                      <button
                        onClick={() => handleRetry(file.id)}
                        disabled={deletingFile === file.id}
                        className="text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={`Retry ${file.name}`}
                      >
                        <ArrowCounterClockwise size={20} />
                      </button>
                    )}

                    {file.status !== 'processing' && (
                      <button
                        onClick={() => handleDelete(file.id, file.name)}
                        disabled={deletingFile === file.id}
                        className="text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={`Delete ${file.name}`}
                      >
                        <Trash size={20} />
                      </button>
                    )}
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
