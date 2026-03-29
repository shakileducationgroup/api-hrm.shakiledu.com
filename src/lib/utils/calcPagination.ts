export interface I_OptionsResponse {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
}

export interface I_PaginationOptions {
  page?: number;
  limit?: number;
  sortOrder?: string;
  sortBy?: string;
  fc?: "true" | "false";
}

export const calculatePagination = (
  options: I_PaginationOptions
): I_OptionsResponse => {
  const page: number = Number(options.page) || 1;
  const limit: number = Number(options.limit) || 10;
  const skip: number = (Number(page) - 1) * limit;

  const sortBy: string = options.sortBy || "createdAt";
  const sortOrder: string = options.sortOrder || "desc";

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

export const calcTotalPages = (totalCount: number, limit: number): number => {
  return Math.ceil(totalCount / limit);
};
