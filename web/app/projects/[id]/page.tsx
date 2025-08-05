"use client";

import React, { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useParams } from 'next/navigation';

import { supabaseClient } from "@/lib/supabase";

import { FolderSimple, WarningCircle, Spinner, PencilSimpleIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/FileUpload";
import { FilesTable } from "@/components/FilesTable";
import { Button } from "@/components/ui/button";

import { IProject } from "../layout";

export interface IFileItem {
    id: string;
    name: string;
    size?: number;
    mime_type?: string;
    created_at: string;
    status: "processing" | "completed" | "failed"
}

const nameFormSchema = z.object({
    title: z.string().min(1, "Project title cannot be empty").max(20, "Project title must be less than 20 characters")
});

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

    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const [selectedDoc, setSelectedDoc] = React.useState<null | IFileItem>(null);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<z.infer<typeof nameFormSchema>>({
        resolver: zodResolver(nameFormSchema),
        defaultValues: {
            title: 'project?.name',
        },
    });
    const title = watch("title");

    const { data: projectData, mutate: mutateProject } = useSWR(`/api/projects/${projectId}`, null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const onSubmit = (data: z.infer<typeof nameFormSchema>) => {
        setIsEditing(false);

        mutateProject(
            async (currentData: IProject) => {
                const res = await fetch(`/api/projects/${projectId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: data.title }),
                });

                if (!res.ok) {
                    throw new Error("Failed to update");
                }

                return {
                    ...currentData,
                    title: data.title,
                };
            },
            {
                optimisticData: { ...(projectData || {}), title: data.title },
                rollbackOnError: true,
                revalidate: false,
                populateCache: true,
            }
        );
    };

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
        <>
            <header className="flex items-center justify-between gap-4 mb-12 flex-shrink-0">
                <form
                    className="group relative flex items-center gap-2 cursor-pointer"
                    onClick={() => setIsEditing(true)}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    {isEditing ? (
                        <div>
                            <input
                                {...register("title")}
                                ref={(e) => {
                                    register("title").ref(e);
                                    inputRef.current = e;
                                }}
                                onBlur={handleSubmit(onSubmit)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSubmit(onSubmit)();
                                    }
                                }}
                                className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-transparent border-0 border-b transition-colors w-fit focus:outline-none ${errors.title ? "border-red-400" : "border-gray-300 focus:border-gray-400"
                                    }`}
                            />
                            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold relative after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[1px] after:bg-gray-300 after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:origin-left">
                                    {title}
                                </h1>
                                <PencilSimpleIcon className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                        </div>
                    )}
                </form>

                <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-10">
                    <Link className="text-base font-medium" href="/projects">My projects</Link>
                    <Button>+ New Project</Button>
                </div>
            </header>

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
        </>
    );
};

export default DashboardPage;