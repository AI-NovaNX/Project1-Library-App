export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
