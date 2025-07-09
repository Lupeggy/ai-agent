import { useQueryState } from "nuqs";

// Define constants locally to avoid client/server module sharing issues
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = 1;

export const useMeetingsFilter = () => {
  // Use individual useQueryState calls for each parameter
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", { defaultValue: DEFAULT_PAGE, parse: (value) => parseInt(value, 10) });
  const [pageSize, setPageSize] = useQueryState("pageSize", { defaultValue: DEFAULT_PAGE_SIZE, parse: (value) => parseInt(value, 10) });
  const [agentId, setAgentId] = useQueryState("agentId", { defaultValue: "" });
  const [status, setStatus] = useQueryState("status", { defaultValue: "" });

  // Return both state and a setter function to update all parameters at once
  return [
    { search, page, pageSize, agentId, status },
    (params: { search?: string; page?: number; pageSize?: number; agentId?: string; status?: string }) => {
      if (params.search !== undefined) setSearch(params.search);
      if (params.page !== undefined) setPage(params.page);
      if (params.pageSize !== undefined) setPageSize(params.pageSize);
      if (params.agentId !== undefined) setAgentId(params.agentId);
      if (params.status !== undefined) setStatus(params.status);
    }
  ] as const;
};