import { useQueryState } from "nuqs";

// Define constants locally to avoid client/server module sharing issues
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = 1;

export const useAgentsFilter = () => {
  // Use individual useQueryState calls for each parameter
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", { defaultValue: DEFAULT_PAGE, parse: (value) => parseInt(value, 10) });
  const [pageSize, setPageSize] = useQueryState("pageSize", { defaultValue: DEFAULT_PAGE_SIZE, parse: (value) => parseInt(value, 10) });

  // Return both state and a setter function to update all parameters at once
  return [
    { search, page, pageSize },
    (params: { search?: string; page?: number; pageSize?: number }) => {
      if (params.search !== undefined) setSearch(params.search);
      if (params.page !== undefined) setPage(params.page);
      if (params.pageSize !== undefined) setPageSize(params.pageSize);
    }
  ] as const;
};