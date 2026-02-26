import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View, Modal, Linking } from "react-native";

import DateTimePickerModal from "../../components/DateTimePickerModal";
import ExpenseCreateModal from "../../components/ExpenseCreateModal";
import { fetchMyExpenses, ExpenseRow } from "../../src/api/expenses";

const UI = {
  bg: "#f6f7fb",
  card: "#ffffff",
  border: "rgba(15,23,42,0.08)",
  text: "#0f172a",
  sub: "rgba(15,23,42,0.65)",
  primary: "#2563eb",
  soft: "rgba(37,99,235,0.08)",
};

function formatYMD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function money(n: any) {
  const x = Number(n || 0);
  return x.toFixed(2);
}

function fmtDT(v?: string | null) {
  if (!v) return "-";
  try {
    return String(v).slice(0, 19).replace("T", " ");
  } catch {
    return v;
  }
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = String(status || "PENDING").toUpperCase();
  const style =
    s === "APPROVED"
      ? { bg: "rgba(16,185,129,0.12)", bd: "rgba(16,185,129,0.25)", tx: "#065f46" }
      : s === "REJECTED"
      ? { bg: "rgba(239,68,68,0.12)", bd: "rgba(239,68,68,0.25)", tx: "#991b1b" }
      : { bg: "rgba(15,23,42,0.06)", bd: "rgba(15,23,42,0.12)", tx: UI.text };

  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: style.bd,
        backgroundColor: style.bg,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontWeight: "900", color: style.tx, fontSize: 12 }}>{s}</Text>
    </View>
  );
}

function Pill({
  label,
  value,
  onPress,
  onClear,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  onClear?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: UI.border,
        backgroundColor: pressed ? "rgba(15,23,42,0.03)" : "#fff",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: "800", color: UI.sub }}>{label.toUpperCase()}</Text>
        <Text style={{ marginTop: 2, fontSize: 13, fontWeight: "800", color: UI.text }} numberOfLines={1}>
          {value || "All"}
        </Text>
      </View>

      {value && onClear ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onClear();
          }}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 10,
            backgroundColor: "rgba(15,23,42,0.06)",
          }}
        >
          <Text style={{ fontWeight: "900", color: UI.text }}>×</Text>
        </Pressable>
      ) : (
        <Text style={{ fontWeight: "900", color: UI.sub }}>›</Text>
      )}
    </Pressable>
  );
}

function ExpenseViewModal({
  open,
  row,
  onClose,
}: {
  open: boolean;
  row: ExpenseRow | null;
  onClose: () => void;
}) {
  if (!open || !row) return null;

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen">
      <Pressable
        onPress={onClose}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15,23,42,0.45)",
          padding: 16,
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: UI.border,
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: UI.text }}>Expense Details</Text>
          <Text style={{ marginTop: 4, color: UI.sub, fontWeight: "700", fontSize: 12 }}>{row.id}</Text>

          <View style={{ marginTop: 12, gap: 8 }}>
            <StatusBadge status={row.status} />

            <Text style={{ fontWeight: "900", color: UI.text }}>Category: {row.category || "-"}</Text>
            <Text style={{ fontWeight: "900", color: UI.text }}>Amount: {money(row.amount)}</Text>
            <Text style={{ color: UI.sub, fontWeight: "700" }}>Incurred At: {fmtDT(row.incurredAt)}</Text>

            {row.receiptUrl ? (
              <Pressable
                onPress={() => Linking.openURL(row.receiptUrl!)}
                style={({ pressed }) => ({
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: pressed ? "rgba(37,99,235,0.85)" : UI.primary,
                })}
              >
                <Text style={{ fontWeight: "900", color: "#fff" }}>Open Receipt</Text>
              </Pressable>
            ) : (
              <Text style={{ color: UI.sub, fontWeight: "700" }}>Receipt: None</Text>
            )}

            {row.description ? (
              <View style={{ marginTop: 6, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: UI.border }}>
                <Text style={{ fontWeight: "900", color: UI.text }}>Description</Text>
                <Text style={{ marginTop: 6, color: UI.sub, fontWeight: "700" }}>{row.description}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                marginTop: 10,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: pressed ? "rgba(15,23,42,0.10)" : "rgba(15,23,42,0.06)",
                borderWidth: 1,
                borderColor: UI.border,
              })}
            >
              <Text style={{ fontWeight: "900", color: UI.text }}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ExpenseScreen() {
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const today = useMemo(() => formatYMD(new Date()), []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState("");

  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<ExpenseRow | null>(null);

  const reqSeq = useRef(0);

  const buildParams = (p: number) => ({
    page: p,
    limit,
    fromDate: from || undefined,
    toDate: to || undefined,
    status: status || undefined,
  });

  async function fetchPage(p: number, mode: "initial" | "refresh" | "more") {
    const seq = ++reqSeq.current;
    if (mode === "initial") setLoadingInitial(true);
    if (mode === "refresh") setRefreshing(true);
    if (mode === "more") setLoadingMore(true);

    try {
      const data = await fetchMyExpenses(buildParams(p));
      if (seq !== reqSeq.current) return;

      const list = data?.data || [];
      const pag = data?.pagination;

      setTotalPages(pag?.totalPages || 1);

      if (p === 1) setRows(list);
      else {
        setRows((prev) => {
          const map = new Map(prev.map((x) => [String(x.id), x]));
          list.forEach((x) => map.set(String(x.id), x));
          return Array.from(map.values());
        });
      }

      setPage(p);
    } finally {
      if (mode === "initial") setLoadingInitial(false);
      if (mode === "refresh") setRefreshing(false);
      if (mode === "more") setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchPage(1, rows.length ? "refresh" : "initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, status]);

  const onRefresh = async () => {
    await fetchPage(1, "refresh");
  };

  const onLoadMore = async () => {
    if (loadingInitial || refreshing || loadingMore) return;
    if (page >= totalPages) return;
    await fetchPage(page + 1, "more");
  };

  const resetFilters = () => {
    setFrom(today);
    setTo(today);
    setStatus("");
  };

  if (loadingInitial && rows.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: UI.bg }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: UI.bg }}>
      {/* Header */}
      <View style={{ padding: 16, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: UI.text }}>Expenses</Text>
          <Text style={{ marginTop: 4, color: UI.sub, fontWeight: "700", fontSize: 13 }}>
            Submit & track your expenses.
          </Text>
        </View>

        <Pressable
          onPress={() => setCreateOpen(true)}
          style={({ pressed }) => ({
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: pressed ? "rgba(37,99,235,0.85)" : UI.primary,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>+ Add</Text>
        </Pressable>
      </View>

      {/* Filters */}
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          padding: 12,
          borderRadius: 16,
          backgroundColor: UI.card,
          borderWidth: 1,
          borderColor: UI.border,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Pill label="From" value={from} onPress={() => setOpenFrom(true)} onClear={() => setFrom(today)} />
          </View>
          <View style={{ flex: 1 }}>
            <Pill label="To" value={to} onPress={() => setOpenTo(true)} onClear={() => setTo(today)} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => {
              const s = String(status || "").toUpperCase();
              const next = s === "" ? "PENDING" : s === "PENDING" ? "APPROVED" : s === "APPROVED" ? "REJECTED" : "";
              setStatus(next);
            }}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: pressed ? "rgba(15,23,42,0.08)" : "rgba(15,23,42,0.06)",
              borderWidth: 1,
              borderColor: UI.border,
            })}
          >
            <Text style={{ fontWeight: "900", color: UI.text }}>
              Status: {status ? String(status).toUpperCase() : "ALL"}
            </Text>
          </Pressable>

          <Pressable
            onPress={resetFilters}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: pressed ? "rgba(37,99,235,0.12)" : UI.soft,
              borderWidth: 1,
              borderColor: "rgba(37,99,235,0.20)",
            })}
          >
            <Text style={{ fontWeight: "900", color: UI.primary }}>Reset</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onRefresh}
          style={({ pressed }) => ({
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: pressed ? "rgba(15,23,42,0.08)" : "rgba(15,23,42,0.06)",
            borderWidth: 1,
            borderColor: UI.border,
          })}
        >
          <Text style={{ fontWeight: "900", color: UI.text }}>Refresh</Text>
        </Pressable>

        <Text style={{ color: UI.sub, fontWeight: "700", fontSize: 12 }}>
          Page {page} / {totalPages}
        </Text>
      </View>

      {/* List */}
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18 }}
        data={rows}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          <View style={{ paddingVertical: 16 }}>
            {loadingMore ? <ActivityIndicator /> : null}
            {!loadingMore && page < totalPages ? (
              <Pressable
                onPress={onLoadMore}
                style={({ pressed }) => ({
                  marginTop: 10,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: pressed ? "rgba(15,23,42,0.08)" : "rgba(15,23,42,0.06)",
                  borderWidth: 1,
                  borderColor: UI.border,
                })}
              >
                <Text style={{ fontWeight: "900", color: UI.text }}>Load more</Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={{ padding: 16, borderRadius: 16, backgroundColor: UI.card, borderWidth: 1, borderColor: UI.border }}>
            <Text style={{ fontWeight: "900", color: UI.text }}>No expenses found</Text>
            <Text style={{ marginTop: 6, color: UI.sub, fontWeight: "700" }}>Try changing date/status filters.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setViewRow(item);
              setViewOpen(true);
            }}
            style={({ pressed }) => ({
              padding: 14,
              borderRadius: 16,
              backgroundColor: UI.card,
              borderWidth: 1,
              borderColor: UI.border,
              marginBottom: 10,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: UI.sub, fontSize: 12, fontWeight: "900" }}>CATEGORY</Text>
                <Text style={{ marginTop: 4, color: UI.text, fontWeight: "900", fontSize: 15 }} numberOfLines={1}>
                  {item.category || "Expense"}
                </Text>

                <Text style={{ marginTop: 4, color: UI.sub, fontWeight: "700" }} numberOfLines={1}>
                  Incurred: {fmtDT(item.incurredAt)}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge status={item.status} />
                <Text style={{ marginTop: 8, fontWeight: "900", color: UI.text }}>
                  ৳ {money(item.amount)}
                </Text>
              </View>
            </View>

            {item.description ? (
              <Text style={{ marginTop: 10, color: UI.sub, fontWeight: "700" }} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <Text style={{ marginTop: 10, color: UI.primary, fontWeight: "900" }}>Tap to view details →</Text>
          </Pressable>
        )}
      />

      {/* Date modals */}
      <DateTimePickerModal
        open={openFrom}
        title="Pick From Date"
        mode="date"
        value={from}
        onClose={() => setOpenFrom(false)}
        onApply={(v) => setFrom(v)}
      />
      <DateTimePickerModal
        open={openTo}
        title="Pick To Date"
        mode="date"
        value={to}
        onClose={() => setOpenTo(false)}
        onApply={(v) => setTo(v)}
      />

      {/* Create modal */}
      <ExpenseCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={async () => {
          await fetchPage(1, "refresh");
        }}
      />

      {/* View modal */}
      <ExpenseViewModal open={viewOpen} row={viewRow} onClose={() => setViewOpen(false)} />
    </View>
  );
}