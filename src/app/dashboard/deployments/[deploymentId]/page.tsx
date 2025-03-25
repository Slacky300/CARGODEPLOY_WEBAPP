"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import DashboardPage from "@/components/DashboardPage";
import { RefreshCcw, FileCode2 } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import ParticularCommitDeploy from "./ParticularCommitDeploy";
import { useUserGithubToken } from "@/hooks/use-user-details";

interface Deployment {
  deploymentId: string;
  createdAt: Date;
  gitHubRepoURL: string;
  gitHubRepoName: string;
  deploymentStatus: string;
  commitSha?: string;
  commitMsg?: string;
  commitAuthor?: string;
}

interface Project {
  id: string;
  name: string;
  gitHubRepoURL: string;
  slugIdentifier: string;
  rootDir: string;
  branch: string;
  token: string;
  userId: string;
}

interface Deployments {
  projectName: string;
  project: Project;
  githubRepoOwner: string;
  isPrivate: boolean;
  deployments: Deployment[];
}

const RespectiveDeployment = () => {
  const { deploymentId } = useParams();
  const [deployments, setDeployments] = useState<Deployments | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const { token } = useUserGithubToken();

  const { isLoading, isError, error, refetch } = useQuery({
    queryKey: ["deployments", deploymentId],
    queryFn: async () => {
      const res = await fetch(`/api/deployment/${deploymentId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch deployments");
      }
      const { data } = await res.json();
      setDeployments(data);
      return data;
    },
  });

  const handleOnClick = () => {
    setShowModal(true);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full w-full">
        <PageLoader text="Hang tight! We are fetching your deployments." />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center flex-1 h-full w-full p-4">
        <p className="text-red-500">
          Error loading deployments: {(error as Error)?.message}
        </p>
      </div>
    );
  }

  return (
    <DashboardPage title={`Project: ${deployments?.projectName}`} route="/dashboard">
      <div className="flex flex-col gap-6 p-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-wide text-black">Deployments {deployments?.githubRepoOwner}</h1>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            <RefreshCcw size={18} />
            Refresh
          </button>

          <Button
            variant="outline"
            type="button"
            className="text-sm"
            onClick={handleOnClick}
          >
            Choose Commit
          </Button>
        </div>

        {showModal && (
          <ParticularCommitDeploy
            onClose={() => setShowModal(false)}
            repoOwner={deployments?.githubRepoOwner || ""}
            repoName={deployments?.project.gitHubRepoURL.split("/").at(-1)?.split('.')[0] || ""}
            token={token as string}
            deploymentId={deploymentId as string}
            isPrivate={deployments?.isPrivate || false}
            onCommitSubmit={(commit) => console.log(commit)}
          />
        )}



        {/* Deployments List */}
        <ul className="w-full space-y-4">
          {deployments?.deployments.map((deployment) => (
            <li
              key={deployment.deploymentId}
              className="border border-gray-300 rounded-lg shadow-sm hover:shadow-lg transition-shadow p-5 bg-white"
            >
              {/* Repo and Deployment Status */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h2
                  onClick={() => router.push(`/dashboard/deployments/view/${deployment.deploymentId}`)}
                  className="flex cursor-pointer items-center gap-3 font-semibold text-lg text-black hover:underline"
                >
                  <FileCode2 size={22} className="text-gray-700" />
                  {deployment.gitHubRepoName}
                </h2>

                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${deployment.deploymentStatus === "SUCCESS"
                    ? "bg-green-500 text-white"
                    : deployment.deploymentStatus === "FAILED"
                      ? "bg-red-500 text-white"
                      : "bg-yellow-300 text-yellow-800"
                    }`}
                >
                  {deployment.deploymentStatus.toUpperCase()}
                </span>
              </div>

              {/* Commit Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
                <div className="flex items-center gap-2 bg-gray-700 text-white px-3 py-1 rounded-full font-medium w-fit">
                  <span>Commit:</span>
                  <span className="font-mono">{deployment.commitSha?.slice(0, 10)}</span>
                </div>

                {deployment.commitMsg && (
                  <div className="text-gray-600 italic truncate max-w-xs">
                    {deployment.commitMsg}
                  </div>
                )}

                {deployment.commitAuthor && (
                  <div className="text-gray-500 font-medium">
                    by <span className="text-black font-semibold">{deployment.commitAuthor}</span>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="mt-3 text-sm text-gray-700">
                <span className="font-medium">Created At:</span>{" "}
                {new Date(deployment.createdAt).toLocaleString()}
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium">GitHub Repo:</span>{" "}
                <a
                  href={deployment.gitHubRepoURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {deployment.gitHubRepoURL}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardPage>
  );
};

export default RespectiveDeployment;
