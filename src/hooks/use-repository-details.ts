import { fetchBranches } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const useRepositoryDetails = (owner:string | undefined, repo: string | undefined, token?: string) => {
    if (!owner || !repo) {
        throw new Error('Owner and repo are required to fetch branches');
    }
    const branchesQuery = useQuery({
        queryKey: ['branches', owner, repo],
        queryFn: async () => await fetchBranches(owner, repo, token)
    });


    return {
        branches: branchesQuery.data,
        branchesLoading: branchesQuery.isLoading,
        branchesError: branchesQuery.isError,
    }

}