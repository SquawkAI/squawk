"use client";

import React, { ReactNode } from "react";
import { useParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { FolderSimple, WarningCircle, Spinner } from "@phosphor-icons/react";
import { FileUpload } from "@/components/FileUpload";
import { FilesTable } from "@/components/FilesTable";
import { supabaseClient } from "@/lib/supabase";
import useSWR from "swr";
export interface IFileItem {
    id: string;
    name: string;
    size?: number;
    mime_type?: string;
    created_at: string;
    status: "processing" | "completed" | "failed"
}

const PreviewPlaceholder = ({ icon, title, message }: { icon: ReactNode, title: string, message: string }) => (
    <div className="w-full h-full bg-white border rounded-lg p-8 flex flex-col items-center justify-center text-center text-gray-500">
        {icon}
        <h2 className="text-xl font-semibold text-black mb-2">{title}</h2>
        <p>{message}</p>
    </div>
);

const DashboardPage: React.FC = () => {
    const { id: projectId } = useParams();

    const [refreshTrigger, setRefreshTrigger] = React.useState(0);
    const [searchTerm, setSearchTerm] = React.useState("");

    const [selectedDoc, setSelectedDoc] = React.useState<null | IFileItem>(null);

    const handleUploadSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // fetch preview of selected doc from supabase storage
    const { data: previewLink, error: fetchPreviewLinkError, isLoading: fetchPreviewLinkLoading } = useSWR(
        selectedDoc ? `signed-url/${selectedDoc.name}` : null, // KEY
        async () => {
            const { data, error } = await supabaseClient
                .storage
                .from("user-uploads")
                .createSignedUrl(
                    `${projectId}/${selectedDoc?.name}`,
                    3600
                );

            if (error) throw error;
            return data?.signedUrl;
        },
        {
            revalidateOnFocus: false,
        }
    );

    return (
        <div className="flex h-full gap-8">
            {/* Left half */}
            <div className="w-1/2 space-y-6 overflow-y-auto">
                {/* Title + Search */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-semibold">Sources</h1>
                    <Input
                        placeholder="Search your sources"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Upload area */}
                {projectId && (<FileUpload onUploadSuccess={handleUploadSuccess} projectId={projectId?.toString()} />)}

                {/* Sources table */}
                {projectId && (
                    <FilesTable
                        refreshTrigger={refreshTrigger}
                        projectId={projectId?.toString()}
                        searchTerm={searchTerm}

                        selectedDoc={selectedDoc}
                        setSelectedDoc={setSelectedDoc}
                    />
                )}
            </div>

            {/* Right half */}
            <div className="w-1/2 flex items-center justify-center">
                {fetchPreviewLinkLoading ? (
                    <PreviewPlaceholder
                        icon={<Spinner size={48} weight="regular" className="mb-4 animate-spin-slow" />}
                        title="Loading..."
                        message="Fetching preview link for your file."
                    />
                ) : fetchPreviewLinkError ? (
                    <PreviewPlaceholder
                        icon={<WarningCircle size={48} weight="regular" className="mb-4 text-red-500" />}
                        title="Preview failed"
                        message="We couldn't load the file preview. Try again later."
                    />
                ) : previewLink ? (
                    <div className="w-full h-full bg-white border rounded-lg p-8 flex flex-col">
                        <iframe
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(previewLink)}&embedded=true`}
                            width="100%"
                            height="100%"
                        />
                    </div>
                ) : (
                    <PreviewPlaceholder
                        icon={<FolderSimple size={48} weight="regular" className="mb-4" />}
                        title="No file selected"
                        message="Choose a file from the left to preview it here."
                    />
                )}
            </div>
        </div>
    );
};

export default DashboardPage;