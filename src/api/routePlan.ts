import api from "./api";

export type RouteRow = {
  id: string;
  userId: string;
  customerId: string;
  date: string; // usually YYYY-MM-DD
  notes?: string;
  userName?: string;
  customerName?: string;
};

export type RouteListResponse = {
  data: RouteRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type RouteListParams = {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
};

export async function fetchRoutePlans(params: RouteListParams) {
  const res = await api.get<RouteListResponse>("/route", { params });
  return res.data;
}

export async function fetchCustomersDropdown() {
  const res = await api.get<any[]>("/customers/dropdown");
  return res.data || [];
}