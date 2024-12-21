"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import DashboardPage from '@/components/DashboardPage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
// Import any icons you want from lucide-react
import { RefreshCcw, FileCode2 } from 'lucide-react';

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

  const {
    data,
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
        <LoadingSpinner />
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
    <DashboardPage title={`Project: ${deployments?.projectName}`}>
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
                <h2 className="flex cursor-pointer items-center gap-2 font-semibold text-lg text-black">
                  <FileCode2 size={20} />
                  {deployment.gitHubRepoName} <span className='text-sm text-white bg-gray-700 px-2 py-1 rounded-full font-medium'>Commit #8975</span>
                </h2>
                <span
                  className="text-sm px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor:
                      deployment.deploymentStatus === 'success'
                        ? '#DEF7EC'
                      : deployment.deploymentStatus === 'failed'
                        ? 'red'
                        : '#DDB928',
                    color:
                      deployment.deploymentStatus === 'success'
                        ? '#03543F'
                        : deployment.deploymentStatus === 'failed'
                        ? 'white'
                        : 'white',
                  }}
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