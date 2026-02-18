import { useState } from "react";
import { useAuth, useUserOrders, useSettings } from "../hooks/useData";
import { supabase } from "../lib/supabase";

// Fixed cutoff time in code (12:00:00 / noon)

const OrderForm = () => {
  const { user } = useAuth();
  const { orders, loading: ordersLoading } = useUserOrders(user?.id);
  const { settings } = useSettings();

  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");



  const hasOrderedToday = orders && orders.length > 0;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    if (!settings?.biryani_active || settings?.biryani_end) {
  throw new Error("Biryani ordering is closed by admin");
}

    e.preventDefault();
    if (!user) return;

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (!settings?.biryani_active || settings?.biryani_end) {
  throw new Error("Biryani ordering is closed by admin");
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
disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ width: "100%" }}
            >
              {submitting ? "Placing Order..." : "Place Order"}
            </button>
          </form>
        )}

        
      </div>
    </div>
  );
};

export default OrderForm;
