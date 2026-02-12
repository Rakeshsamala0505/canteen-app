import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../contexts/AuthContext";

/* ================= AUTH ================= */

export const useAuth = () => {
  const auth = useAuthContext();
  const isAdmin = Boolean(sessionStorage.getItem("adminSession"));

  return {
    user: auth.user,
    isAdmin,
    loading: auth.initializing,
  };
};

/* ================= SETTINGS ================= */

export const useSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .limit(1); // ✅ safer than .single()

      if (!error) {
        setSettings(data?.[0] || null); // ✅ always safe
      }

      setLoading(false);
    };

    fetchSettings();

    const channel = supabase
      .channel("settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settings",
          filter: "id=eq.1",
        },
        (payload) => setSettings(payload.new)
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { settings, loading };
};

/* ================= SELECTED CURRIES ================= */

export const useSelectedCurries = () => {
  const [curries, setCurries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings) return;

    const fetchCurries = async () => {
      if (settings.selected_curries?.length) {
        const { data } = await supabase
          .from("curries")
          .select("*")
          .in("id", settings.selected_curries);

        setCurries(data || []);
      } else {
        setCurries([]);
      }
      setLoading(false);
    };

    fetchCurries();
  }, [settings]);

  return { curries, loading };
};

/* ================= USER ORDERS ================= */

export const useUserOrders = (userId?: string) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today);

      setOrders(data || []);
      setLoading(false);
    };

    fetchOrders();

    const channel = supabase
      .channel(`user_orders_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        fetchOrders
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return { orders, loading };
};

/* ================= ALL ORDERS (ADMIN) ================= */

export const useAllOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    const fetchOrders = async () => {
      const { data } = await supabase
  .from("orders")
  .select("*")
  .eq("date", today)
  .order("created_at", { ascending: true });


      setOrders(data || []);
      setLoading(false);
    };

    fetchOrders();

    const channel = supabase
      .channel("all_orders_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        fetchOrders
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { orders, loading };
};
