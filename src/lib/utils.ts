import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface GithubRepository {
  id: number;
  full_name: string;
  private: boolean;
  name: string;
  url: string;
  description: string;
  clone_url: string;
  visibility: string;
  owner: {
    login: string;
    avatar_url: string;
  },
  [key: string]: unknown;
}

interface GithubBranch {
  name: string;
  [key: string]: unknown;
}


export const getOauthToken = async (): Promise<string> => {
  const res = await fetch("/api/external/oauth-token/github", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  return data.token;
};

export const fetchGithubRepos = async (): Promise<GithubRepository[]> => {
  const token = await getOauthToken();
  const response = await fetch("https://api.github.com/user/repos", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const repositories: GithubRepository[] = await response.json();
  return repositories;
};

export const fetchPrivateGithubRepos = async (
  token: string
): Promise<GithubRepository[]> => {
  try {
    const repositoriesResponse = await fetch(
      "https://api.github.com/installation/repositories",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    const repositories = await repositoriesResponse.json();
    return repositories.repositories as GithubRepository[];
  } catch (e) {
    console.error(e);
    return [];
  }
};

const owner = 'GuptaAman11'; // Repository owner
    const repo = 'Blog-app'; // Repository name

    export const fetchCommits =async() => {
      const url = `https://api.github.com/repos/${owner}/${repo}/commits`;
    
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/vnd.github+json', // GitHub's recommended media type
          },
        });
    
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
    
        const commits = await response.json();
      } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching commits:', error.message);
        } else {
            console.error('Error fetching commits:', error);
        }
      }

    }

export const fetchAllGithubRepos = async (
  token?: string
): Promise<GithubRepository[]> => {
  try {
    let privateRepos: GithubRepository[] = [];
    if (token) {
      privateRepos = await fetchPrivateGithubRepos(token);
    }

    const publicRepos = await fetchGithubRepos();
    const allRepos = [...privateRepos, ...publicRepos];
    return allRepos;
  } catch (e) {
    console.error("Error fetching repositories:", e);
    return [];
  }
};

export const fetchBranches = async (
  owner: string,
  repo: string,
  token?: string
): Promise<GithubBranch[]> => {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch branches.");
    }

    const branches: GithubBranch[] = await response.json();
    return branches;
  } catch (error) {
    console.error("Error fetching branches:", error);
    return [];
  }
};
