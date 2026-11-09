import { useInfiniteQuery } from "@tanstack/react-query";
import { useRefreshOnFocus } from "@/lib/useRefreshOnFocus";
import { historyApi } from "../api";

export function useHistory(status?: string) {
  const query = useInfiniteQuery({
    queryKey: ["driver", "history", status],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => historyApi.rides(pageParam, status),
    getNextPageParam: (last) => last?.hasNext ? last.page + 1 : undefined,
  });
  useRefreshOnFocus(query.refetch);
  return query;
}
