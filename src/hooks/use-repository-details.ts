import { fetchBranches } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const useRepositoryDetails = (owner:string, repo: string, token?: string) => {
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