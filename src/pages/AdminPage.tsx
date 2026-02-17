
import { useState, useEffect } from "react";
import { useSettings, useAllOrders } from "../hooks/useData";
import { supabase } from "../lib/supabase";
import "../styles/adminOrders.css";




const AdminPage = () => {
  const { settings } = useSettings();
const { orders } = useAllOrders();
const [liveOrders, setLiveOrders] = useState<any[]>([]);
const [canteenOpen, setCanteenOpen] = useState(false);
const [loadingPage, setLoadingPage] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<string[]>([]);
  const [biryaniActive, setBiryaniActive] = useState(false);
const [biryaniEnd, setBiryaniEnd] = useState(false);
  const [menuDate, setMenuDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showSaved, setShowSaved] = useState(false);
  const menuOptions = settings?.menu_options && settings.menu_options.length > 0
    ? settings.menu_options
    : ["Roti", "Raita", "Dal", "Sambar", "potato", "Chana", "Egg", "Rice"];
  // const menuImages = settings?.menu_images || {};

  // Fetch admin state for today
  useEffect(() => {

    useEffect(() => {
  const closeAtMidnight = async () => {
    const now = new Date();

    if (now.getHours() === 23 && now.getMinutes() === 59) {

      const today = new Date().toISOString().split("T")[0];

      await supabase
        .from("admin_state")
        .upsert([{
          date: today,
          canteen_open: false,
          biryani_active: true,
          biryani_end: false
        }], { onConflict: "date" });

    }
  };

  const timer = setInterval(closeAtMidnight, 60000);
  return () => clearInterval(timer);
}, []);
useEffect(() => {
  const resetAfterDay = async () => {
    const now = new Date();

    if (now.getHours() === 0 && now.getMinutes() === 1) {

      const today = new Date().toISOString().split("T")[0];

      await supabase
        .from("admin_state")
        .upsert([{
          date: today,
          canteen_open: false,
          menu_items: [],
          biryani_active: false,
          biryani_end: false
        }], { onConflict: "date" });

    }
  };

  const timer = setInterval(resetAfterDay, 60000);
  return () => clearInterval(timer);
}, []);

const today = new Date().toLocaleDateString("en-CA");
    setMenuDate(today);
    const fetchAdminState = async () => {
      const { data } = await supabase
        .from("admin_state")
.select("canteen_open, menu_items, biryani_active, biryani_end")
        .eq("date", today)
.maybeSingle();
      if (data) {
        setCanteenOpen(!!data.canteen_open);
        setSelectedMenu(Array.isArray(data.menu_items) ? data.menu_items : []);
        setBiryaniActive(!!data.biryani_active);
setBiryaniEnd(data.biryani_active ? !!data.biryani_end : false);

      } else {
        await supabase
          .from("admin_state")
          .upsert([{ date: today, canteen_open: false, menu_items: [], biryani_active: false, biryani_end: false
 }], { onConflict: "date" });
        setCanteenOpen(false);
        setSelectedMenu([]);
        setBiryaniActive(false);
setBiryaniEnd(false);
      }
      setLoadingPage(false);

    };
    fetchAdminState();
  }, []);
 useEffect(() => {
  if (!orders) return;

  setLiveOrders(
    orders.filter(o => o.date === menuDate)
  );
}, [orders, menuDate]);



  // Toggle canteen open/close
  const handleToggleCanteen = () => {
    setCanteenOpen((prev) => !prev);
    if (canteenOpen) {
      setSelectedMenu([]);
      setBiryaniActive(false);
setBiryaniEnd(false);
    }
  };
const handleToggleBiryani = () => {
  setBiryaniActive(prev => {
    if (prev) setBiryaniEnd(false); // turning OFF → reset End
    return !prev;
  });
};
  const handleToggleBiryaniEnd = () => {
  if (!biryaniActive) return; // only works when biryani ON
  setBiryaniEnd(prev => !prev);
};

  const handleMenuChange = (value: string) => {
    setSelectedMenu((prev) => {
      let updated;
      if (prev.includes(value)) {
        updated = prev.filter((item) => item !== value);
      } else {
        updated = [...prev, value];
      }
      return updated;
    });
  };
  const handleSave = async () => {
    const today = menuDate;
    await supabase
      .from("admin_state")
      .upsert([
        {
          date: today,
          canteen_open: canteenOpen,
          menu_items: selectedMenu,
          biryani_active: biryaniActive,
biryani_end: biryaniEnd,
        },
      ], { onConflict: "date" });
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  // ✅ mark order completed (instant UI update)
const markCompleted = async (orderId: number) => {
  await supabase
    .from("orders")
    .update({ completed: true })
    .eq("id", orderId);

  setLiveOrders(prev =>
    prev.map(o =>
      o.id === orderId ? { ...o, completed: true } : o
    )
  );
};


// ✅ undo completed
const unselectOrder = async (orderId: number) => {
  await supabase
    .from("orders")
    .update({ completed: false })
    .eq("id", orderId);

  setLiveOrders(prev =>
    prev.map(o =>
      o.id === orderId ? { ...o, completed: false } : o
    )
  );
};
const refreshOrders = async () => {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("date", menuDate)   // important: only today
    .order("created_at", { ascending: false });

  setLiveOrders(data || []);
};

// ✅ Get only Biryani orders once
const biryaniOrders = liveOrders.filter(
  o => o.menu === "Biryani"
);

// ✅ Calculate total only from biryaniOrders
const totalQuantity = biryaniOrders.reduce(
  (sum, o) => sum + Number(o.quantity || 0),
  0
);


if (loadingPage) {
  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        fontWeight: 700,
        fontSize: 18,
      }}
    >
      Loading admin panel...
    </div>
  );
}



  return (

    
<div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 90px" }}>
      {/* ...existing code... */}

      <section className="admin-section section1" >
        <div
          style={{
            background: "linear-gradient(135deg, #f8e7d1 60%, #ffe7b3 100%)",
            borderRadius: 16,
            boxShadow: "0 2px 12px #f3e2c7",
            padding: 20,
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Canteen button */}
          <button
            style={{
              width: "100%",
              background: canteenOpen ? "#28a745" : "#dc3545",
              color: "#fff",
              fontWeight: 700,
              border: "none",
              borderRadius: 12,
              padding: "14px 0",
              fontSize: 18,
              marginBottom: 0,
              boxShadow: canteenOpen
                ? "0 0 10px #28a745"
                : "0 0 10px #dc3545",
            }}
            onClick={handleToggleCanteen}
          >
            {canteenOpen ? "CANTEEN OPEN" : "CANTEEN CLOSED"}
          </button>

          {canteenOpen && (
            <>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ minWidth: 120, flex: 1, maxHeight: 260, display: 'flex', flexDirection: 'column' }}>
                  <label>Menu</label>
                  <select
                    value=""
                    onChange={(e) => handleMenuChange(e.target.value)}
                    style={{
                      width: "80%",
                      marginTop: 4,
                      borderRadius: 8,
                      padding: "6px 8px",
                    }}
                  >
                    <option value="" disabled>
                      Select menu item
                    </option>
                    {menuOptions.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  {/* Show selected items below dropdown */}
                  {/* Today's Menu display */}
{selectedMenu.length === 0 ? (
  <div style={{ marginTop: 8, color: "#aaa", fontSize: 14 }}>
    No menu selected
  </div>
) : (
  <div style={{ marginTop: 12 }}>
    <div
      style={{
        fontWeight: 700,
        textDecoration: "underline",
        marginBottom: 0,
        color: "#5a4328",
        fontSize: 12,
      }}
    >
      Today's Menu
    </div>

    <div style={{ maxHeight: 160, overflowY: "auto" }}>
      {selectedMenu.map((item, index) => (
        <div
          key={item}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 6,
            fontWeight: 600,
            color: "#8b7355",
            fontSize: 12,
          }}
        >
          {index + 1}) {item}

          <button
            style={{
              marginLeft: "auto",
              background: "#eee",
              border: "none",
              borderRadius: 4,
              padding: "2px 8px",
              cursor: "pointer",
              fontSize: 12,
            }}
            onClick={() => handleMenuChange(item)}
            type="button"
          >
            Remove
          </button>

          {/* {menuImages[item] && (
            <img
              src={menuImages[item]}
              alt={item}
              style={{
                width: 32,
                borderRadius: 8,
              }}
            />
          )} */}
        </div>
      ))}
    </div>
  </div>
)}

                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 40, marginTop: 45 }}>
                  <button
                    style={{
                      background: biryaniActive ? "#ffc107" : "#eee",
                      padding: 10,
                      borderRadius: 8,
                      border: "none",
                      fontWeight: 700,
                      width: 120,
                    }}
                    onClick={handleToggleBiryani}
                  >
                    {biryaniActive ? "Biryani ON" : "Biryani OFF"}
                  </button>
                 <button
  disabled={!biryaniActive}
  style={{
    background: biryaniEnd ? "#dc3545" : "#eee",
    padding: 10,
    borderRadius: 8,
    border: "none",
    fontWeight: 700,
    width: 120,
  }}
  onClick={handleToggleBiryaniEnd}
>
  {biryaniEnd ? "Biryani Ended" : "End Biryani"}
</button>

                </div>
              </div>
            </>
          )}
        </div>
      </section>


      {canteenOpen && biryaniActive && (
  <section style={{ marginTop: 16, overflowX: "auto" }}>
    <table className="orders-table">
  <thead>
    <tr>
      <th className="col-serial">S.No</th>
      <th className="col-name">Name</th>
      <th className="col-qty">Qty</th>
      <th className="col-phone">Phone</th>
      <th className="col-status">Status</th>
      <th className="col-action">Action</th>
    </tr>
  </thead>

  <tbody>

  {/* ✅ Show message when no orders */}
  {biryaniOrders.length === 0 && (
    <tr>
      <td colSpan={6} style={{ textAlign: "center", padding: 12 }}>
        No orders yet
      </td>
    </tr>
  )}

  {/* ✅ Show orders when they exist */}
  {biryaniOrders.map((order, idx) => (
    <tr
      key={order.id}
      className={`order-row ${order.completed ? "completed" : ""}`}
    >
      <td className="col-serial">{idx + 1}</td>
      <td className="col-name">{order.user_name}</td>
      <td className="col-qty">{order.quantity}</td>
      <td className="col-phone">{order.user_phone}</td>
      <td className="col-status">
        {order.completed ? "Completed" : "Pending"}
      </td>
      <td className="col-action">
        <button
          className={`order-btn ${
            order.completed ? "unselect" : "complete"
          }`}
          onClick={() =>
            order.completed
              ? unselectOrder(order.id)
              : markCompleted(order.id)
          }
        >
          {order.completed ? "Unselect" : "Complete"}
        </button>
      </td>
    </tr>
  ))}

  {/* ✅ TOTAL only when orders exist */}
  {biryaniOrders.length > 0 && (
    <tr style={{ background: "#f1efe9", fontWeight: 700 }}>
      <td></td>
      <td>TOTAL</td>
      <td>{totalQuantity}</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  )}

</tbody>

</table>

  </section>
)}
{/* contact card */}

<div className="canteen-info-card">
  <div className="note-title">NOTE</div>
  <div className="info-row">
    <span className="icon">⏰</span>
    <span className="label">Canteen Timings:</span>
    <span className="value">12:30 PM – 1:30 PM</span>
  </div>
<div className="info-row">
    <span className="icon">📅</span>
    <span className="label">Canteen Holiday:</span>
    <span className="value">Saturday & Sunday</span>
  </div>
  
  <div className="info-row">
    <span className="icon">📞</span>
    <span className="label">Canteen:</span>
    <span className="value">+91 96665 72449</span>
  </div>
  <div className="info-row">
    <span className="icon">📧</span>
    <span className="label">Any Issues or Feedback</span>
    <a href="mailto:rakeshsamala0505@gmail.com" className="value">Mail Me</a>
  </div>
  <div className="info-row">
    <span className="icon">⚠️</span>
    <span className="value">Canteen will Open by 12:30 PM</span>
  </div>
</div>

      {/* Footer: always visible at the bottom with Save and Logout buttons */}
      <footer className="admin-footer-mobile">
        <button className="footer-btn logout-btn" onClick={handleLogout}>Logout</button>
        <button
    className="footer-btn refresh-btn"
    onClick={refreshOrders}
  >
    Refresh
  </button>
        <button className="footer-btn save-btn" onClick={handleSave}>Save</button>
        {showSaved && (
          <div style={{
            position: 'fixed',
            left: '50%',
            bottom: '70px',
            transform: 'translateX(-50%)',
            background: '#28e745',
            color: '#111',
            padding: '6px 18px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 16,
            boxShadow: '0 2px 8px #b6eab6',
            zIndex: 10000,
            transition: 'opacity 0.2s',
          }}>
            Saved
          </div>
        )}
      </footer>
    </div>
  );
};

export default AdminPage;
