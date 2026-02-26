import api from "./api";

export type CollectionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type CollectionRow = {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  paymentType: "CASH" | "UPI" | "CHEQUE";
  receiptUrl?: string | null;
  status: CollectionStatus | string;
  collectedAt?: string | null;
  createdAt?: string | null;

  // included from backend
  order?: {
    id: string;
    orderNumber?: string | null;
    totalAmount?: number | null;
    paidAmount?: number | null;
    paymentStatus?: string | null;
    customerId?: string | null;
    customer?: { id: string; name?: string | null; phone?: string | null };
  };
};

export type CollectionsResponse = {
  data: CollectionRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export async function fetchMyCollections(params: {
  page?: number;
  limit?: number;
  fromDate?: string; // "YYYY-MM-DD" or ISO
  toDate?: string;   // "YYYY-MM-DD" or ISO
  status?: string;
}) {
  const res = await api.get<CollectionsResponse>("/collections/my", { params });
  return res.data;
}

export async function createCollection(payload: {
  orderId: string;
  amount: number;
  paymentType: "CASH" | "UPI" | "CHEQUE";
  receiptUrl?: string | null;
}) {
  const res = await api.post("/collections", payload);
  return res.data;
}

export async function downloadReceiptPdf(collectionId: string) {
  // NOTE: if you want later, we can download to device storage; for now we just open URL in browser.
  return `/collections/${collectionId}/receipt.pdf`;
}