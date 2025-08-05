'use client';

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";

import { PencilSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { IProject } from "@/app/projects/layout";

interface DashboardHeaderProps {
    selectedProject?: IProject
}

const nameFormSchema = z.object({
    title: z.string().min(1, "Project title cannot be empty").max(20, "Project title must be less than 20 characters")
});

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ selectedProject: project }) => {
    const pathname = usePathname();
    
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<z.infer<typeof nameFormSchema>>({
        resolver: zodResolver(nameFormSchema),
        defaultValues: {
            title: project?.name,
        },
    });
    const title = watch("title");

    const { data: projectData, mutate: mutateProject } = useSWR(`/api/projects/${project?.id}`, null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const onSubmit = (data: z.infer<typeof nameFormSchema>) => {
        setIsEditing(false);

        mutateProject(
            async (currentData: IProject) => {
                const res = await fetch(`/api/projects/${project?.id}`, {
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

    return (
        <header className="flex items-center justify-between gap-4 mb-12 flex-shrink-0">
            { /* Match routes /projects/[id] but not /projects */ }
            {pathname?.match(/^\/projects\/[^/]+$/) && project ? (
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
            ) : (
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">Projects</p>
            )}

            <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-10">
                <Link className="text-base font-medium" href="/projects">My projects</Link>
                <Button>+ New Project</Button>
            </div>
        </header>
    )
};

export default DashboardHeader;