import  { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import "../styles/userHome.css";


const UserHome = () => {
  const { user, profile } = useAuthContext();
// 🔒 Order cutoff time (change later if needed)
const BIRYANI_CUTOFF_HOUR = 13;
const BIRYANI_CUTOFF_MINUTE = 44;
const [showTimeoutPopup, setShowTimeoutPopup] = useState(false);
const [showBiryaniOverPopup, setShowBiryaniOverPopup] = useState(false);
const [showCancelBlockedPopup, setShowCancelBlockedPopup] = useState(false);
const [biryaniPopupShown, setBiryaniPopupShown] = useState(false);
const [lastBiryaniEnd, setLastBiryaniEnd] = useState(false);
const [prevBiryaniEnd, setPrevBiryaniEnd] = useState(false);

const todayKey = `biryani_end_seen_${new Date().toISOString().split("T")[0]}`;

const [closingPopup, setClosingPopup] = useState(false);



  const [menuToday, setMenuToday] = useState<string[]>([]);
  const [menuImages, setMenuImages] = useState<Record<string, string>>({});
  const [biryaniAvailable, setBiryaniAvailable] = useState(false);
const [canteenOpen, setCanteenOpen] = useState<boolean | null>(null);
const [loadingPage, setLoadingPage] = useState(true);
  const [myOrder, setMyOrder] = useState<any>(null);

  const [quantity, setQuantity] = useState(1);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
   const todayObj = new Date();
todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
const today = todayObj.toISOString().split("T")[0];


    const loadAll = async () => {
      // ADMIN STATE
      const { data: state } = await supabase
        .from("admin_state")
.select("canteen_open, menu_items, biryani_active, biryani_end")
        .eq("date", today)
        .maybeSingle();

      if (state) {
        setMenuToday(state.menu_items || []);
        setBiryaniAvailable(!!state.biryani_active);
        setCanteenOpen(!!state.canteen_open);
      } else {
        setCanteenOpen(false);
        setMenuToday([]);
        setBiryaniAvailable(false);
      }

      // USER ORDER
      const { data: orders } = await supabase
  .from("orders")
  .select("*")
  .eq("user_id", user!.id)
  .eq("date", today)   // 👈 THIS LINE FIXES EVERYTHING
  .limit(1);


setMyOrder(orders?.[0] || null);
const alreadySeen = localStorage.getItem(todayKey);

if (
  orders?.[0]?.menu === "Biryani" &&
  state?.biryani_end === true &&
  prevBiryaniEnd === false
) {
  setShowBiryaniOverPopup(true);
}
setPrevBiryaniEnd(!!state?.biryani_end);




      // MENU IMAGES
      const { data: settings } = await supabase
        .from("settings")
        .select("menu_images")
        .eq("id", 1)
        .maybeSingle();

      if (settings?.menu_images) {
        setMenuImages(settings.menu_images);
      }
      setLoadingPage(false);

    };
    Object.keys(localStorage).forEach(key => {
  if (key.startsWith("biryani_end_seen_") && key !== todayKey) {
    localStorage.removeItem(key);
  }
});


    loadAll();

const interval = setInterval(() => {
  loadAll();
}, 3000); // refresh every 4 seconds

return () => clearInterval(interval);

  }, 
  [user?.id]);

const isAfterCutoff = () => {
  const now = new Date();

  const cutoff = new Date();
  cutoff.setHours(BIRYANI_CUTOFF_HOUR, BIRYANI_CUTOFF_MINUTE, 0, 0);

  return now >= cutoff;
};

 const orderBiryani = async () => {
  setError("");
  setSuccess("");


  // ⏰ cutoff popup logic
if (!myOrder && isAfterCutoff()) {
    setShowTimeoutPopup(true);
    return;
  }


   const todayObj = new Date();
todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
const today = todayObj.toISOString().split("T")[0];

    // ✅ ADD THIS BLOCK RIGHT HERE (NEW)
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("name, phone")
    .eq("id", user!.id)
    .single();

  if (profileError || !userProfile) {
    setError("User profile not found");
    return;
  }

  // ❌ BLOCK CANCEL AFTER CUTOFF
// CANCEL ORDER
if (myOrder) {

  // ❌ If after cutoff → block cancel
  if (isAfterCutoff()) {
    setShowCancelBlockedPopup(true);
    return;
  }

  // ✅ If before cutoff → allow cancel
  await supabase.from("orders").delete().eq("id", myOrder.id);
  setMyOrder(null);
  setSuccess("Order cancelled");
  return;
}


    // PLACE ORDER
    const { data, error } = await supabase
  .from("orders")
  .insert([
    {
      user_id: user!.id,
      user_name: userProfile.name,
      user_phone: userProfile.phone,
      menu: "Biryani",
      quantity,
      date: today,
      status: "pending",
    },
  ])
  .select()
  .single();


    if (error) {
      setError("Order failed");
    } else {
      setMyOrder(data);
      setSuccess("Order placed!");
    }
  };
  if (loadingPage) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontWeight: 600 }}>
        Loading canteen...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 90px" }}>
      {!canteenOpen && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            textAlign: "center",
            fontSize: 20,
            fontWeight: 700,
            color: "#dc3545",
            background: "#fff0f0",
            borderRadius: 12,
          }}
        >
          Canteen Closed Today🚫
        </div>
      )}

      {canteenOpen && (
        <>
          <h3 className="welcome-ui">
  Welcome <span>{profile?.name || "User"}</span>
</h3>


          {menuToday.length > 0 && (
<h4 className="menu-heading-ui">Today's Menu</h4>
)}


{/* WHEN MENU NOT YET SET */}
{menuToday.length === 0 ? (
  <div
    style={{
      marginTop: 30,
      padding: 24,
      background: "#fff7e6",
      borderRadius: 16,
      textAlign: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    }}
  >
    <img
  src="/cooking.gif"
  alt="Food preparing"
  style={{ width: 140, marginBottom: 12 }}
/>


    <div style={{ fontSize: 18, fontWeight: 700, color: "#8b7355" }}>
      Food is being prepared 👨‍🍳
    </div>

    <div style={{ fontSize: 14, marginTop: 6, color: "#555" }}>
      Please wait… menu will be updated soon!
    </div>
  </div>
) : (
  /* MENU CARDS */
  <div className="menu-list-ui">
  {menuToday.map((item) => (
    <div className="menu-card-ui">
  <img
    src={menuImages[item]}
    alt={item}
    className="menu-img-ui"
  />

  <div className="menu-title-footer-ui">
    {item}
  </div>
</div>

  ))}
</div>

)}



          {/* BIRYANI SECTION */}
{biryaniAvailable && (
  <div className="order-card-ui">

   <div style={{ marginTop: 16 }}>

      {/* 🍛 Image */}
    <img src="/biryani.jpg" className="biryani-img-ui" />



      {/* Card body */}
      <div style={{ padding: 16 }}>

        {!myOrder && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>

            <span style={{ fontWeight: 700, fontSize: 18 }}>{quantity}</span>

            <button onClick={() => setQuantity(q => Math.min(3, q + 1))}>+</button>

            <span style={{ fontSize: 12, color: "#8b7355", fontWeight: 600 }}>
              (upto 3 only)
            </span>
          </div>
        )}

        <button
          onClick={orderBiryani}
          style={{
            width: "100%",
            background: myOrder ? "#dc3545" : "#ffc107",
            border: "none",
            padding: 14,
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 18,
            color: myOrder ? "#fff" : "#000",
          }}
        >
          {myOrder ? "Cancel Biryani" : "Order Biryani"}
        </button>

        {!myOrder && (
          <div
            style={{
              marginTop: 6,
              textAlign: "center",
              fontSize: 13,
              color: "#dc3545",
              fontWeight: 600,
            }}
          >
            Order by 9:00 AM only!!
          </div>
        )}

        {success && <div style={{ color: "green" }}>{success}</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}
      </div>
    </div>

  </div>
)}
{canteenOpen && biryaniAvailable && myOrder && myOrder.menu === "Biryani" && (
  <div className="order-confirm-card">

    <div className="order-confirm-info">
      <h3>✅ Order Confirmed</h3>

      <p><b>Name:</b> {myOrder.user_name}</p>
      <p><b>Quantity:</b> {myOrder.quantity}</p>

      <p>
        <b>Status:</b>{" "}
        {myOrder.completed ? "Completed ✅" : "Pending 🕒"}
      </p>

      <p>
  <b>Date:</b>{" "}
  {new Date(myOrder.date).toLocaleDateString("en-GB")}
</p>

    </div>

  <img
  src={myOrder.completed ? "/completed.png" : "/confirmed.png"}
  alt="Order status"
  className="order-confirm-img"
/>


  </div>
)}

        </>
      )}
{showTimeoutPopup && (
  <div
    className="popup-overlay"
    onClick={() => {
      setClosingPopup(true);
      setTimeout(() => {
        setShowTimeoutPopup(false);
        setClosingPopup(false);
      }, 600);
    }}
  >
    <div
      className={`popup-card ${closingPopup ? "closing" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <h3>⏰ Time is up</h3>
      <p>
        Biryani already prepared.<br />
        Please contact canteen by phone.
      </p>

      <button
        onClick={() => {
          setClosingPopup(true);
          setTimeout(() => {
            setShowTimeoutPopup(false);
            setClosingPopup(false);
          }, 600);
        }}
      >
        OK
      </button>
    </div>
  </div>
)}
{showBiryaniOverPopup && (
  <div className="popup-overlay" onClick={() => setShowBiryaniOverPopup(false)}>
    <div className="popup-card" onClick={(e) => e.stopPropagation()}>
      <h3>🍛 Biryani Over</h3>
      <p>
        The biryani is finished for today.<br />
        Please come early next time!
      </p>

      <button onClick={() => setShowBiryaniOverPopup(false)}>
        OK
      </button>
    </div>
  </div>
)}
{showCancelBlockedPopup && (
  <div
    className="popup-overlay"
    onClick={() => setShowCancelBlockedPopup(false)}
  >
    <div
      className="popup-card"
      onClick={(e) => e.stopPropagation()}
    >
      <h3>🚫 Cannot Cancel</h3>
      <p>
        The biryani order is already confirmed.<br />
        It cannot be cancelled now.
      </p>

      <button onClick={() => setShowCancelBlockedPopup(false)}>
        OK
      </button>
    </div>
  </div>
)}


<div className="canteen-info-card">
  <div className="info-row">
    <span className="icon">⏰</span>
    <span className="label">Canteen Timings:</span>
    <span className="value">12:30 PM – 1:30 PM</span>
  </div>
<div className="info-row">
    <span className="icon">📅</span>
    <span className="label">Canteen Closed on:</span>
    <span className="value">Saturday & Sunday</span>
  </div>
  <div className="info-row">
    <span className="icon">📧</span>
    <span className="label">Any Issues?</span>
    <a href="mailto:rakeshsamala0505@gmail.com" className="value">Mail Me</a>
  </div>

  <div className="info-row">
    <span className="icon">📞</span>
    <span className="label">Canteen:</span>
    <span className="value">+91 96665 72449</span>
  </div>
</div>

      {/* FOOTER ALWAYS VISIBLE */}
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "fixed",
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "#f9f7f4",
          padding: "12px 16px",
          borderTop: "1px solid #e0dbd8",
          zIndex: 100,
        }}
      >
        <span style={{ color: "#8b7355", fontWeight: 600 }}>
{profile?.name ?? user?.email ?? "User"}
        </span>


        <button
          style={{
            background: "#dc3545",
            color: "#fff",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 700,
            fontSize: 16,
            boxShadow: "0 2px 8px #dc3545",
            border: "none",
            cursor: "pointer",
          }}
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </footer>
    </div>
  );
};

export default UserHome;
