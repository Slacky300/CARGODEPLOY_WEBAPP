"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// Types
interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url?: string;
}

interface CommitChoiceProps {
  token: string;
  isPrivate: boolean;
  repoName: string;
  repoOwner: string;
  deploymentId: string;
  onCommitSubmit?: (commit: Commit) => void;
  onClose: () => void;
}

// API Functions
const fetchCommits = async ({
  repoOwner, 
  repoName, 
  isPrivate, 
  token 
}: {
  repoOwner: string;
  repoName: string;
  isPrivate: boolean;
  token: string;
}): Promise<Commit[]> => {
  const url = isPrivate 
    ? `https://api.github.com/repos/${repoOwner}/${repoName}/commits`
    : `https://api.github.com/repos/${repoOwner}/${repoName}/commits`;
  
  const response = await fetch(url, {
    headers: {
      ...(isPrivate && { Authorization: `token ${token}` }),
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch commits');
  }

  return response.json();
};

const redeployCommit = async ({
  commit,
  commitAuthor,
  commitMessage,
  deploymentId
}: {
  commit: string;
  commitAuthor: string;
  commitMessage: string;
  deploymentId: string;
}) => {
  const response = await fetch(`/api/redeploy/commit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      commit,
      commitAuthor,
      commitMessage,
      deploymentId,
    }),
  });

  if (!response.ok) {
    throw new Error('Redeployment failed');
  }

  return response.json();
};

const ParticularCommitDeploy: React.FC<CommitChoiceProps> = ({ 
  token, 
  isPrivate, 
  deploymentId, 
  repoName, 
  repoOwner, 
  onCommitSubmit, 
  onClose 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch Commits Query
  const { 
    data: commitHistory = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['commits', repoOwner, repoName, isPrivate],
    queryFn: () => fetchCommits({ repoOwner, repoName, isPrivate, token }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Redeploy Mutation
  const redeployMutation = useMutation({
    mutationFn: redeployCommit,
    onSuccess: (data) => {
      toast({
        title: "Redeployment Successful",
        description: "Deployment is in progress. You will be redirected shortly.",
        duration: 5000,
      });
      onCommitSubmit?.(selectedCommit!);
      router.push(`/dashboard/deployments/view/${data.data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Redeployment Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        duration: 5000,
        variant: "destructive"
      });
    }
  });

  // Filtered Commits
  const filteredCommits = commitHistory.filter((commit) =>
    commit.commit.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleRedeployment = () => {
    if (!selectedCommit) {
      toast({
        title: "No Commit Selected",
        description: "Please select a commit to redeploy",
        duration: 5000,
      });
      return;
    }

    redeployMutation.mutate({
      commit: selectedCommit.sha,
      commitAuthor: selectedCommit.commit.author.name,
      commitMessage: selectedCommit.commit.message,
      deploymentId
    });
  };

  // Render Loading or Error States
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
        <div className="text-white">Loading commits...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-red-500">Error loading commits</p>
          <p>{error instanceof Error ? error.message : "Unknown error"}</p>
          <button 
            onClick={onClose} 
            className="mt-4 px-4 py-2 bg-black text-white rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 font-sans">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen">
        <input
          type="text"
          placeholder="Search commits..."
          className="w-full p-2 mb-4 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="space-y-4 overflow-y-auto" style={{ maxHeight: "400px" }}>
          {filteredCommits.map((commit) => (
            <div
              key={commit.sha}
              onClick={() => setSelectedCommit(commit)}
              className={`p-4 bg-gray-100 rounded-lg shadow justify-between sm:flex cursor-pointer hover:bg-gray-200 
                ${selectedCommit?.sha === commit.sha ? 'border-2 border-black' : ''}`}
            >
              <div className="flex flex-col">
                <p className="font-bold">{commit.sha.slice(0, 10)}</p>
                <p>{commit.commit.message}</p>
                <p className="text-sm text-gray-500">
                  {commit.commit.author.name} - {new Date(commit.commit.author.date).toLocaleString()}
                </p>
              </div>
            </div>
          ))}

          {filteredCommits.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No commits found matching your search
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4 space-x-3">
          <button 
            type="button" 
            disabled={!selectedCommit || redeployMutation.isPending}
            className={`px-4 py-2 rounded-sm text-white 
              ${selectedCommit ? 'bg-black' : 'bg-gray-400 cursor-not-allowed'}`}
            onClick={handleRedeployment}
          >
            {redeployMutation.isPending ? 'Deploying...' : 'Deploy'}
          </button>
          <button 
            type="button" 
            className="px-4 py-2 rounded-sm bg-black text-white"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticularCommitDeploy;