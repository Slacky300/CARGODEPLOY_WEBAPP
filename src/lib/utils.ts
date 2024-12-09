import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const getOauthToken = async () => {

  const res = await fetch("/api/external/oauth-token/github", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  return data.token;
}
export const fetchGithubRepos = async () => {



  const token = await getOauthToken();
  const response = await fetch('https://api.github.com/user/repos', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const repositories = await response.json();

  console.log("rRR", repositories);
  return repositories;
}


export const fetchPrivateGithubRepos = async (token: string) => {

  try {
    const repositoriesResponse = await fetch('https://api.github.com/installation/repositories', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    const repositories = await repositoriesResponse.json();
    return repositories.repositories;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export const fetchAllGithubRepos = async (token?: string): Promise<any[]> => {
  try {
    let privateRepos: any[] = [];
    if (token) {
      privateRepos = await fetchPrivateGithubRepos(token); // Fetch private repos
    }

    const publicRepos = await fetchGithubRepos(); // Fetch public repos

    // Merge and return unique repositories
    const allRepos = [...privateRepos, ...publicRepos];
    return allRepos;
  } catch (e) {
    console.error('Error fetching repositories:', e);
    return [];
  }
};
