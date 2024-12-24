"use client";

import GithubAppInstallButton from "@/components/GithubAppInstallButton";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { fetchAllGithubRepos } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import CreateProjectForm from "./CreateProjectForm";
import { Repository } from "@/config";

interface RepoOwner {
    avatar?: string;
    username?: string | null;
    token?: string;
}

const ListRepositories = ({ avatar, username, token }: RepoOwner) => {
    const [search, setSearch] = useState("");
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
    const [nextSection, setNextSection] = useState(false);


    const { data: repositories = [], isLoading, isError } = useQuery<Repository[]>({
        queryKey: ["repositories"],
        queryFn: async () => {
            const repositories = await fetchAllGithubRepos(token);
            return repositories;
        },
    });



    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <LoadingSpinner />
            </div>
        );
    }

  

    if (isError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <p className="text-red-500 text-center">
                    Failed to load repositories. Please try again later.
                </p>
            </div>
        );
    }

    if(nextSection) {
        return <CreateProjectForm token={token} repo={selectedRepo} setSelectedRepo={setSelectedRepo} setNextSection={setNextSection} />;
    }

    const filteredRepositories = repositories && repositories?.filter((repo) =>
        repo.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 px-20"
            style={{ maxHeight: "calc(100vh - 18em)" }}
        >
            <header className="bg-gray-800 text-white p-4 shadow-md rounded-sm"
                style={{ maxHeight: "calc(100vh - 18em)" }}
            >
                <div className="max-w-4xl mx-auto flex items-center space-x-4">
                    {avatar && (
                        <img
                            src={avatar}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full shadow-lg"
                        />
                    )}
                    <div>
                        <h1 className="text-lg font-semibold">GitHub Repositories</h1>
                        {username && (
                            <p className="text-sm text-white">@{username}</p>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-4xl min-w-full mx-auto py-4 px-6 space-y-6"
                style={{ maxHeight: "calc(100vh - 18em)" }} 
            >
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div
                    className="bg-white rounded-lg shadow-md p-6 overflow-y-auto"
                    style={{ maxHeight: "calc(100vh - 25em)" }} 
                >
                    {filteredRepositories.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {/* Add + icon for private repos */}
                            {filteredRepositories.map((repo) => (
                                <li
                                    key={repo.id}
                                    className={`py-4 flex items-start justify-between cursor-pointer ${selectedRepo?.id === repo.id ? "bg-gray-800 p-4 rounded-sm text-white" : ""}`}
                                    onClick={() => setSelectedRepo(repo)}
                                >
                                    <div>
                                        <span
                                            className={`text-lg font-medium text-black hover:underline ${selectedRepo?.id === repo.id ? "text-white" : ""}`}
                                        >
                                            {repo.name}
                                        </span>
                                        <p className={`text-sm text-gray-500 mt-1 ${selectedRepo?.id === repo.id ? "text-white" : ""}`}>
                                            {repo.description || "No description available"}
                                        </p>
                                    </div>
                                    <div>
                                        {repo.visibility === "private" ? (
                                            <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">
                                                Private
                                            </span>
                                        ) : (
                                            <span className="bg-green-100 text-green-600 text-xs font-semibold px-2 py-1 rounded-full">
                                                Public
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        //Improve No repositories found UI
                        <div className="text-center justify-center">
                            <div className="flex flex-col justify-center items-center">
                                <Image src="/images/norepos.svg" alt="No Repositories" width={192} height={192} />
                                <p className="text-gray-500 text-lg my-3">No repositories found</p>
                                <GithubAppInstallButton />
                            </div>
                        </div>
                    )}
                </div>
            </main>

                
            <Button
                onClick={() => setNextSection(true)}
                className="mx-10 bg-gray-800"
                disabled={!selectedRepo}
            >
                Continue
            </Button>
        </div>
    );
};

export default ListRepositories;
