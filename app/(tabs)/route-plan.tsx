import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

import DateTimePickerModal from "../../components/DateTimePickerModal";
import CustomerPickerModal from "../../components/CustomerPickerModal";

import { fetchCustomersDropdown, fetchRoutePlans, RouteRow } from "../../src/api/routePlan";

const UI = {
  bg: "#f6f7fb",
  card: "#ffffff",
  border: "rgba(15,23,42,0.08)",
  text: "#0f172a",
  sub: "rgba(15,23,42,0.65)",
  primary: "#2563eb",
  soft: "rgba(37,99,235,0.08)",
};

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
        <Text
          style={{
            marginTop: 2,
            fontSize: 13,
            fontWeight: "800",
            color: UI.text,
          }}
          numberOfLines={1}
        >
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

export default function RoutePlanScreen() {
  const router = useRouter();

  // list state
  const [rows, setRows] = useState<RouteRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // loading state
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // filters (UI input)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced
  const [customerId, setCustomerId] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // dropdown
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerModal, setCustomerModal] = useState(false);

  // date picker modals (reusable component)
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  // avoid race-condition overwrites
  const reqSeq = useRef(0);

  const selectedCustomerName = useMemo(() => {
    if (!customerId) return "";
    const c = customers.find((x) => String(x?.id) === String(customerId));
    return c?.name || "";
  }, [customers, customerId]);

  // ✅ Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function loadCustomers() {
    try {
      const data = await fetchCustomersDropdown();
      setCustomers(data || []);
    } catch {
      setCustomers([]);
    }
  }

  const buildParams = (p: number) => ({
    page: p,
    limit,
    search: search ? search : undefined,
    customerId: customerId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  async function fetchPage(p: number, mode: "initial" | "refresh" | "more") {
    const seq = ++reqSeq.current;

    if (mode === "initial") setLoadingInitial(true);
    if (mode === "refresh") setRefreshing(true);
    if (mode === "more") setLoadingMore(true);

    try {
      const data = await fetchRoutePlans(buildParams(p));

      // If a newer request already started, ignore this result
      if (seq !== reqSeq.current) return;

      const list: RouteRow[] = data?.data || [];
      const meta = data?.meta;

      setTotalPages(meta?.totalPages || 1);

      if (p === 1) {
        setRows(list);
      } else {
        // Dedupe by id
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

  // load customers once
  useEffect(() => {
    loadCustomers();
  }, []);

  // when filters change => reset to page 1
  useEffect(() => {
    fetchPage(1, rows.length ? "refresh" : "initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, customerId, dateFrom, dateTo]);

  const onRefresh = async () => {
    await fetchPage(1, "refresh");
  };

  const onLoadMore = async () => {
    if (loadingInitial || refreshing || loadingMore) return;
    if (page >= totalPages) return;
    await fetchPage(page + 1, "more");
  };

  const resetFilters = () => {
    setSearchInput("");
    setCustomerId("");
    setDateFrom("");
    setDateTo("");
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
      <View style={{ padding: 16, paddingBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "900", color: UI.text }}>Route Plans</Text>
        <Text style={{ marginTop: 4, color: UI.sub, fontWeight: "700", fontSize: 13 }}>
          View your assigned routes (filter by date/customer).
        </Text>
      </View>

      {/* Filters card */}
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
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search customer..."
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: UI.border,
            backgroundColor: "#fff",
            fontWeight: "700",
          }}
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Pill label="Date From" value={dateFrom} onPress={() => setOpenFrom(true)} onClear={() => setDateFrom("")} />
          </View>
          <View style={{ flex: 1 }}>
            <Pill label="Date To" value={dateTo} onPress={() => setOpenTo(true)} onClear={() => setDateTo("")} />
          </View>
        </View>

        <Pill
          label="Customer"
          value={selectedCustomerName}
          onPress={() => setCustomerModal(true)}
          onClear={() => setCustomerId("")}
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={onRefresh}
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
            <Text style={{ fontWeight: "900", color: UI.text }}>Refresh</Text>
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

        {searchInput.trim() !== search ? (
          <Text style={{ color: UI.sub, fontWeight: "700", fontSize: 12 }}>Searching…</Text>
        ) : null}
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
          loadingMore ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator />
            </View>
          ) : (
            <View style={{ height: 10 }} />
          )
        }
        ListEmptyComponent={
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: UI.card,
              borderWidth: 1,
              borderColor: UI.border,
            }}
          >
            <Text style={{ fontWeight: "900", color: UI.text }}>No routes found</Text>
            <Text style={{ marginTop: 6, color: UI.sub, fontWeight: "700" }}>
              Try changing filters (date/customer).
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 14,
              borderRadius: 16,
              backgroundColor: UI.card,
              borderWidth: 1,
              borderColor: UI.border,
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: UI.sub, fontSize: 12, fontWeight: "900" }}>DATE</Text>
                <Text style={{ marginTop: 4, color: UI.text, fontWeight: "900", fontSize: 15 }}>
                  {item.date || "-"}
                </Text>
              </View>

              <View style={{ flex: 2 }}>
                <Text style={{ color: UI.sub, fontSize: 12, fontWeight: "900" }}>CUSTOMER</Text>
                <Text
                  style={{ marginTop: 4, color: UI.text, fontWeight: "900", fontSize: 15 }}
                  numberOfLines={1}
                >
                  {item.customerName || "-"}
                </Text>
              </View>
            </View>

            {item.notes ? (
              <Text style={{ marginTop: 10, color: UI.sub, fontWeight: "700" }} numberOfLines={2}>
                Notes: {item.notes}
              </Text>
            ) : null}

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/visits",
                  params: { customerId: String(item.customerId) },
                })
              }
              style={({ pressed }) => ({
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: pressed ? "rgba(37,99,235,0.85)" : UI.primary,
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>Start Visit</Text>
            </Pressable>
          </View>
        )}
      />

      {/* Shared Customer Picker */}
      <CustomerPickerModal
        open={customerModal}
        customers={customers}
        selectedId={customerId}
        onClose={() => setCustomerModal(false)}
        onSelect={(id) => setCustomerId(id)}
        allowAll={true}
      />

      {/* Shared Date Picker */}
      <DateTimePickerModal
        open={openFrom}
        title="Pick Date From"
        mode="date"
        value={dateFrom}
        onClose={() => setOpenFrom(false)}
        onApply={(v) => setDateFrom(v)}
      />
      <DateTimePickerModal
        open={openTo}
        title="Pick Date To"
        mode="date"
        value={dateTo}
        onClose={() => setOpenTo(false)}
        onApply={(v) => setDateTo(v)}
      />
    </View>
  );
}