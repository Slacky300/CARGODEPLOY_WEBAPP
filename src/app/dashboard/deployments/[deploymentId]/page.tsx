"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import DashboardPage from '@/components/DashboardPage';
import { RefreshCcw, FileCode2 } from 'lucide-react';
import PageLoader from '@/components/PageLoader';

interface Deployment {
  deploymentId: string;
  createdAt: Date;
  gitHubRepoURL: string;
  gitHubRepoName: string;
  deploymentStatus: string;
}

interface Deployments {
  projectName: string;
  deployments: Deployment[];
}

const RespectiveDeployment = () => {
  const { deploymentId } = useParams();
  const [deployments, setDeployments] = useState<Deployments | null>(null);
  const router = useRouter();

  const {
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['deployments', deploymentId],
    queryFn: async () => {
      const res = await fetch(`/api/deployment/${deploymentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch deployments');
      }
      const { data } = await res.json();
      setDeployments(data);
      return data;
    },
  });

  // Loading status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full w-full">
        <PageLoader text="Hang tight! We are fetching your deployments." />
      </div>
    );
  }

  // Error status
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
    <DashboardPage title={`Project: ${deployments?.projectName}`} route='/dashboard'>
      <div className="flex flex-col gap-6 p-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-wide text-black">
            Deployments
          </h1>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
        </div>

        {/* Deployments List */}
        <ul className="w-full space-y-4">
          {deployments?.deployments.map((deployment) => (
            <li
              key={deployment.deploymentId}
              className="border border-gray-300 rounded-md hover:shadow-lg transition-shadow p-4 bg-white"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h2 onClick={() => router.push(`/dashboard/deployments/view/${deployment.deploymentId}`)} className="flex cursor-pointer items-center gap-2 font-semibold text-lg text-black">
                  <FileCode2 size={20} />
                  {deployment.gitHubRepoName} <span className='text-sm text-white bg-gray-700 px-2 py-1 rounded-full font-medium'>Commit #8975</span>
                </h2>
                <span
                  className={`text-sm px-2 py-1 rounded-full font-medium ${deployment.deploymentStatus === 'SUCCESS'
                      ? 'bg-green-500 text-white'
                      : deployment.deploymentStatus === 'FAILED'
                        ? 'bg-red-500 text-white'
                        : 'bg-yellow-300 text-yellow-800'
                    }`}

                >
                  {deployment.deploymentStatus.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-2">
                <span className="font-medium">Created At:</span>{' '}
                {new Date(deployment.createdAt).toLocaleString()}
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium">GitHub Repo:</span>{' '}
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