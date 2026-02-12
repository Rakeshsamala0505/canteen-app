import { useState, useEffect } from "react";
import { useAuth, useUserOrders, useSettings } from "../hooks/useData";
import { supabase } from "../lib/supabase";

// Fixed cutoff time in code (12:00:00 / noon)
const CUTOFF_TIME = "12:00:00";

const OrderForm = () => {
  const { user } = useAuth();
  const { orders, loading: ordersLoading } = useUserOrders(user?.id);
  const { settings } = useSettings();

  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCutoffTime, setIsCutoffTime] = useState(false);

  // Check if current time is past cutoff
  useEffect(() => {
    const checkCutoff = () => {
      const now = new Date();
      const currentTime = now.toTimeString().split(" ")[0]; // HH:MM:SS
      setIsCutoffTime(currentTime >= CUTOFF_TIME);
    };

    checkCutoff();
    const interval = setInterval(checkCutoff, 60000);
    return () => clearInterval(interval);
  }, []);

  const hasOrderedToday = orders && orders.length > 0;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (isCutoffTime) {
        throw new Error("Orders are locked after 12:00 PM");
      }

      if (hasOrderedToday) {
        throw new Error("You have already placed an order today");
      }

      const today = new Date().toISOString().split("T")[0];

      const { error: insertError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user.id,
            menu: "Biryani",          // ✅ REQUIRED (fixes 409)
            quantity,
            date: today,
            status: "pending",
          },
        ]);

      if (insertError) throw insertError;

      setSuccess("Order placed successfully!");
      setQuantity(1);
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orders || orders.length === 0) return;

    try {
      if (isCutoffTime) {
        throw new Error("Cannot cancel orders after 12:00 PM");
      }

      await supabase.from("orders").delete().eq("id", orders[0].id);

      setSuccess("Order cancelled successfully!");
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to cancel order");
    }
  };

  if (settings?.canteen_closed) {
    return (
      <div className="container">
        <div className="notice notice-warning">
          The canteen is closed. Cannot place orders at this time.
        </div>
      </div>
    );
  }

  if (ordersLoading) {
    return (
      <div className="container" style={{ textAlign: "center" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: "500px", margin: "0 auto" }}>
        <h2>Place Your Order</h2>

        {isCutoffTime && (
          <div className="notice notice-danger">
            ⏰ Orders are locked after 12:00 PM. Cutoff time has passed.
          </div>
        )}

        {error && <div className="notice notice-error">{error}</div>}
        {success && <div className="notice notice-success">{success}</div>}

        {hasOrderedToday ? (
          <>
            <div className="notice notice-info">
              You have already placed an order today!
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <strong>Order Details:</strong>
              <p>Plates: {orders?.[0]?.quantity || "-"}</p>
              <p>Status: Pending</p>
            </div>

            {!isCutoffTime && (
              <button className="btn-danger" onClick={handleCancelOrder}>
                Cancel Order
              </button>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmitOrder}>
            <div className="form-group">
              <label htmlFor="quantity">Number of Plates (Max 3)</label>
              <input
                id="quantity"
                type="number"
                min="1"
                max="3"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.min(3, Math.max(1, parseInt(e.target.value) || 1))
                  )
                }
                disabled={isCutoffTime}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isCutoffTime || submitting}
              style={{ width: "100%" }}
            >
              {submitting ? "Placing Order..." : "Place Order"}
            </button>
          </form>
        )}

        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.875rem",
            color: "var(--text-light)",
          }}
        >
          📍 Cutoff time: 12:00 PM | ⏰ Current time:{" "}
          {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default OrderForm;
