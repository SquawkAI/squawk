"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { IProject } from "./layout";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import {  MagnifyingGlass } from "@phosphor-icons/react";
import { DotsThreeVertical } from "@phosphor-icons/react";

const ProjectsPage: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { data, error, isLoading, mutate } = useSWR(
    "/api/projects",
    async () => {
      const res = await axios.get("/api/projects");
      return res.data;
    }
  );

  const getLastOpened = (updatedAt: string) => {
    const updatedDate = new Date(updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - updatedDate.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHrs < 1) return "just now";
    if (diffHrs === 1) return "1 hour ago";
    return `${diffHrs} hours ago`;
  };

  const filteredProjects = useMemo(() => {
    const allProjects: IProject[] = data?.projects || [];
    const q = query.trim().toLowerCase();
    return q
      ? allProjects.filter((p) => p.title.toLowerCase().includes(q))
      : allProjects;
  }, [query, data]);

  async function createProject(values: {
    title: string;
    description?: string;
  }) {
    const { data: created } = await axios.post<IProject>("/api/projects", {
      title: values.title,
      description: values.description,
    });

    await mutate(
      (current?: { projects: IProject[] } | null) => {
        const list = current?.projects ?? [];
        return {
          ...(current ?? { projects: [] }),
          projects: [created, ...list],
        };
      },
      { revalidate: false, populateCache: true }
    );

    if (created) router.push(`/projects/${created.id}`);
  }

  async function deleteProject(projectId: string) {
    await axios.delete(`/api/projects/${projectId}`);
    await mutate(
      (current?: { projects: IProject[] } | null) => {
        const list = current?.projects ?? [];
        return {
          ...(current ?? { projects: [] }),
          projects: list.filter((p) => p.id !== projectId),
        };
      },
      { revalidate: false, populateCache: true, rollbackOnError: true }
    );
  }

  if (error)
    return (
      <div className="text-center text-red-500">Failed to load projects.</div>
    );
  if (isLoading)
    return <div className="text-center text-gray-500">Loading projects...</div>;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 pb-0 flex flex-col gap-4">
      
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="inline-flex flex-col justify-center items-start gap-1">
          <div className="text-3xl font-bold">Projects</div>
          <div className="text-stone-600 text-md">
            View and manage all projects
          </div>
        </div>

        <NewProjectDialog
          trigger={
            <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-10">
              <Button>+ New Project</Button>
            </div>
          }
          onCreate={createProject}
        />
      </header>

      {/* Page content */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">All Projects</h2>

        {/* Search */}
        <div className="relative">
          <input
            type="search"
            placeholder="Search your projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
          />
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
          />
        </div>

        {/* Projects */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
            <p className="mb-4 italic">
              Nothing here yet… let’s fix that! Create your first project below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {filteredProjects.map((p) => (
              <ProjectCard
                key={p.id}
                title={p.title}
                description={p.description}
                lastOpened={getLastOpened(p.updated_at)}
                onOpen={() => router.push(`/projects/${p.id}`)}
                onDelete={() => deleteProject(p.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// ProjectCard component
const ProjectCard: React.FC<{
  title: string;
  description?: string;
  lastOpened: string;
  onOpen: () => void;
  onDelete: () => void;
}> = ({ title, description, lastOpened, onOpen, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key === "Escape") setMenuOpen(false);
      if (
        e instanceof MouseEvent &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      )
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [menuOpen]);

  return (
    <div className="flex flex-col relative border border-gray-300 rounded-md p-2 justify-between">
      {/* Clickable Content */}
      <div
        className="flex items-stretch gap-4 py-2 cursor-pointer rounded"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        {/* Folder Icon */}
        <div className="h-full w-auto">
          <svg
            className="h-full"
            viewBox="0 0 118 113"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M108.714 20.4546H60.7609L45.2975 2.99792C44.4593 2.0441 43.4615 1.28788 42.3621 0.773227C41.2627 0.258576 40.0837 -0.00424073 38.8935 5.17433e-05H9.0595C6.65677 5.17433e-05 4.35245 1.07756 2.65346 2.99555C0.954479 4.91353 0 7.51488 0 10.2273V102.669C0.00299637 105.275 0.921452 107.774 2.55395 109.617C4.18645 111.46 6.39974 112.497 8.70844 112.5H109.218C111.486 112.497 113.66 111.478 115.264 109.667C116.868 107.857 117.77 105.402 117.773 102.842V30.6819C117.773 27.9694 116.819 25.3681 115.12 23.4501C113.421 21.5321 111.117 20.4546 108.714 20.4546Z"
              fill="#F59E0B"
            />
          </svg>
        </div>
        {/* Content */}
        <div className="flex flex-col w-full">
          <div className="text-lg leading-tight text-black truncate max-w-xs">
            {title}
          </div>
          <div className="text-sm text-stone-500 truncate max-w-xs">
            {description || "No description provided"}
          </div>
          <div className="relative w-full">
            <div className="text-sm text-stone-500/50 truncate max-w-xs">
              Opened {lastOpened}
            </div>
            <div className="absolute right-0 top-0">
              <div className="relative inline-block">
                <button
                  className="flex items-center justify-center rounded-full hover:bg-gray-100 transition z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((v) => !v);
                  }}
                  tabIndex={0}
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                  aria-label="Open project menu"
                  type="button"
                >
                  <DotsThreeVertical
                    weight="bold"
                    className="w-auto h-5 text-gray-400"
                  />
                </button>
                {menuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded shadow-lg p-2 z-20"
                  >
                    <button
                      className="flex items-center gap-1 group cursor-pointer p-1 rounded-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <Trash2
                        size={18}
                        className="text-black group-hover:text-red-500 transition-colors "
                      />
                      <div className="text-sm text-black group-hover:text-red-500 transition-colors">
                        Delete
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
