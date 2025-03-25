"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { DashboardEmptyState } from "./DashboardEmptyState"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLink, Folder, Github, Globe, Terminal, Trash2, Settings } from "lucide-react"

interface Project {
    id: string;
    name: string;
    userId: string;
    gitHubRepoURL: string;
    slugIdentifier: string;
    rootDir: string;
    createdAt: Date;
    updatedAt: Date;
    isDeployed: boolean;
}

export const DashboardPageContent = () => {
    const [open, setOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const { toast } = useToast();

    const { data: projects, isPending: isProjectsLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: async () => {
            const res = await fetch("/api/projects", { method: "GET" });
            const { projects } = await res.json();
            return projects;
        },
    });

    const queryClient = useQueryClient();

    const deleteProject = useMutation({
        mutationFn: async (projectId: string) => {
            const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });

            if (!res.ok) {
                toast({
                    title: "Failed to delete project",
                    description: "Please try again later"
                });
                return false;
            }

            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast({
                title: "Project deleted successfully",
                description: "The project has been removed"
            });
            setOpen(false); // Close modal after success
        },
        onError: () => {
            toast({
                title: "Failed to delete project",
                description: "Please try again later",
                action: <ToastAction altText="Retry" onClick={() => {
                    if (projectToDelete) deleteProject.mutate(projectToDelete.id);
                }}>Retry</ToastAction>
            });
        },
    });

    if (isProjectsLoading) {
        return (
            <div className="flex items-center justify-center flex-1 h-full w-full">
                <LoadingSpinner />
            </div>
        );
    }

    if (!projects || projects.length === 0) {
        return <DashboardEmptyState />;
    }

    return (
        <>
            <ul className="grid max-w-6xl grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project: Project, index: number) => (
                    <li key={index} className="relative group z-10 transition-all duration-200 hover:-translate-y-0.5">
                        <div className="absolute z-0 inset-px rounded-lg bg-white" />

                        <div className="relative p-6 z-10">
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                {/* Left: Project Image */}
                                <div
                                    className="w-12 h-12 rounded-full"
                                    style={{
                                        backgroundImage: `url(https://banner2.cleanpng.com/20240204/weo/transparent-goku-person-wearing-dragon-inspired-outfit-with-1710886882677.webp)`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                />

                                {/* Center: Project Info */}
                                <div className="flex-1 flex flex-col min-w-0">
                                    <h3 className="font-medium text-sm tracking-tight text-gray-950 truncate">
                                        {project.gitHubRepoURL.split("/").pop()?.split(".")[0]}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {format(new Date(project.createdAt), "MMM d, yyyy")}
                                    </p>
                                </div>

                                {/* Right: Live Link */}
                                {project.isDeployed ? (
                                    <Link
                                        href={`https://${project.slugIdentifier}.cargodeploy.me`}
                                        target="_blank"
                                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2"
                                    >
                                        View Live <ExternalLink className="size-4" />
                                    </Link>
                                ) : project.createdAt !== project.updatedAt ? (
                                    <span className="text-sm text-white bg-gray-600 rounded-sm p-2">RETRY</span>
                                ) : null}
                            </div>

                            {/* Project Details */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Github className="size-4 text-brand-500" />
                                    <Button variant="ghost" className="ml-1">View on GitHub</Button>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Globe className="size-4 mr-2 text-brand-500" />
                                    <span className="font-medium">Slug Identifier:</span>
                                    <span className="ml-1">{project.slugIdentifier}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Folder className="size-4 mr-2 text-brand-500" />
                                    <span className="font-medium">Root Directory:</span>
                                    <span className="ml-1">{project.rootDir}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between mt-4">
                                <Link
                                    href={`/dashboard/deployments/${project.id}`}
                                    className="border border-gray-300 px-4 py-2 rounded-md text-sm flex items-center gap-2"
                                >
                                    View Deployments <Terminal className="size-4" />
                                </Link>
                                <div>
                                    {/* Delete Button - Opens Modal */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-500 hover:text-red-600 transition-colors"
                                        aria-label={`Delete ${project.name} project`}
                                        onClick={() => {
                                            setProjectToDelete(project);
                                            setOpen(true);
                                        }}
                                    >
                                        <Trash2 className="size-5" />
                                    </Button>

                                    {/* Settings Button */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-500 hover:text-blue-600 transition-colors"
                                    >
                                        <Settings className="size-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Confirmation Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">
                        Do you really want to delete <strong>{projectToDelete?.name}</strong>? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>No</Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (projectToDelete) {
                                    deleteProject.mutate(projectToDelete.id);
                                }
                            }}
                        >
                            { deleteProject.isPending ? <LoadingSpinner /> : "Yes" }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
