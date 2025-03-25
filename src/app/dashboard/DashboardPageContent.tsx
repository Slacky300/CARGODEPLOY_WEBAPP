"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Folder, Github, Globe, Terminal, Trash2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { useState } from "react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { DashboardEmptyState } from "./DashboardEmptyState"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

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
    deploymentSuccessful: "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED";
}

export const DashboardPageContent = () => {
    const [deletingCategory, setDeletingCategory] = useState<string | null>(null); //update to a more sensible name
    const {toast} = useToast();



    const { data: projects, isPending: isEventCategoriesLoading } = useQuery({ //update to a more sensible name
        queryKey: ["projects"],
        queryFn: async () => {
            const res = await fetch("/api/projects", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const { projects } = await res.json()
            return projects
        },
    });

    const queryClient = useQueryClient();

    const deleteProject = useMutation({
        mutationFn: async (projectId: string) => {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                toast({
                    title: "Failed to delete project",
                    description: "Please try again later"
                })
            }

            const { success } = await res.json();
            return success;
        },
        onSuccess: () => {
            // Invalidate cache or refetch project-related queries
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast({
                title: "Project deleted successfully",
                description: "The project has been deleted successfully"
            })
        },
        onError: (error, projectId) => {
            toast({
                title: "Failed to delete project",
                description: "Please try again later",
                action: <ToastAction altText="Retry" onClick={() => { deleteProject.mutate(projectId) }}>Retry</ToastAction>
            })
        },
    });


    const handleDeleteProject = (projectId: string) => {
        // UseMutation for handling DELETE request

        // Trigger the mutation
        deleteProject.mutate(projectId);
    };


    if (isEventCategoriesLoading) {
        return (
            <div className="flex items-center justify-center flex-1 h-full w-full">
                <LoadingSpinner />
            </div>
        )
    }

    if (!projects || projects.length === 0) {
        return <DashboardEmptyState />
    }


    return (
        <>
            <ul className="grid max-w-6xl grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                {projects.map((project: Project) => (
                    <li
                        key={project.id}
                        className="relative group z-10 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <div className="absolute z-0 inset-px rounded-lg bg-white" />

                        <div className="pointer-events-none z-0 absolute inset-px rounded-lg shadow-sm transition-all duration-300 group-hover:shadow-md ring-1 ring-black/5" />

                        <div className="relative p-6 z-10">
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                {/* Left Side: Project Logo */}
                                <div
                                    className="w-12 h-12 rounded-full"
                                    style={{
                                        backgroundImage: `url(https://banner2.cleanpng.com/20240204/weo/transparent-goku-person-wearing-dragon-inspired-outfit-with-1710886882677.webp)`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                    }}
                                />

                                {/* Center: Project Details */}
                                <div className="flex-1 flex flex-col min-w-0">
                                    <h3 className="font-medium text-sm tracking-tight text-gray-950 truncate">
                                        {project.gitHubRepoURL.split("/").pop()?.split(".")[0]}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {format(new Date(project.createdAt), "MMM d, yyyy")}
                                    </p>
                                </div>

                                {/* Right Side: View Live Link */}
                                {project.isDeployed ? (
                                    <Link
                                    href={`https://${project.slugIdentifier}.cargodeploy.me`}
                                    target="_blank"
                                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2"
                                >
                                    View Live
                                    <ExternalLink className="size-4" />
                                </Link>
                                ): project.deploymentSuccessful === "FAILED" ? (
                                    <>
                                    <span className="text-sm text-white bg-gray-600 rounded-sm p-4">RETRY</span>
                                    </>
                                ):<></>}
                            </div>


                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-sm/5 text-gray-600">
                                    <Github className="size-4 text-brand-500" />
                                    <Button variant={"ghost"} className="ml-1">
                                        View on GitHub
                                    </Button>
                                </div>
                                <div className="flex items-center text-sm/5 text-gray-600">
                                    <Globe className="size-4 mr-2 text-brand-500" />
                                    <span className="font-medium">Slug Identifier:</span>
                                    <span className="ml-1">{project.slugIdentifier}</span>
                                </div>
                                <div className="flex items-center text-sm/5 text-gray-600">
                                    <Folder className="size-4 mr-2 text-brand-500" />
                                    <span className="font-medium">Root Directory:</span>
                                    <span className="ml-1">{project.rootDir}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <Link
                                    href={`/dashboard/deployments/${project.id}`}
                                    className={buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                        className: "flex items-center gap-2 text-sm",
                                    })}
                                >
                                    View Deployments <Terminal className="size-4" />
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-500 hover:text-red-600 transition-colors"
                                    aria-label={`Delete ${project.name} project`}
                                    onClick={() => { handleDeleteProject(project.id) }}
                                >
                                    <Trash2 className="size-5" />
                                </Button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            <Modal
                showModal={!!deletingCategory}
                setShowModal={() => setDeletingCategory(null)}
                className="max-w-md p-8"
            >
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg/7 font-medium tracking-tight text-gray-950">
                            Delete Category
                        </h2>
                        <p className="text-sm/6 text-gray-600">
                            Are you sure you want to delete the category {deletingCategory}?
                            This action cannot be undone.
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setDeletingCategory(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => { }

                            }
                            disabled={false}
                        >
                            {"Delete"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}