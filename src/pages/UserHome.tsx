import { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import "../styles/userHome.css";

const MENU_PRICES: Record<string, number> = {
  Roti: 10,
  Raita: 10,
  Dal: 10,
  Sambar: 10,
  Rice: 10,
  potato: 10,
  Chana: 10,
  Egg: 10,
};

const UserHome = () => {
  const { user, profile } = useAuthContext();

  const [menuToday, setMenuToday] = useState<string[]>([]);
  const [menuImages, setMenuImages] = useState<Record<string, string>>({});

  const [canteenOpen, setCanteenOpen] = useState<boolean>(false);
  const [biryaniAvailable, setBiryaniAvailable] = useState(false);
  const [biryaniEnded, setBiryaniEnded] = useState(false);
  const [biryaniClosed, setBiryaniClosed] = useState(false); // ✅ NEW

  const [loadingPage, setLoadingPage] = useState(true);
  const [myOrder, setMyOrder] = useState<any>(null);

  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showBiryaniOverPopup, setShowBiryaniOverPopup] = useState(false);
  const [showBiryaniClosedPopup, setShowBiryaniClosedPopup] = useState(false);
  const [showBiryaniEndPopup, setShowBiryaniEndPopup] = useState(false);
  const [showOrderLockedPopup, setShowOrderLockedPopup] = useState(false);
  const [showOrderPlacedPopup, setShowOrderPlacedPopup] = useState(false);
  const [showOrderCancelledPopup, setShowOrderCancelledPopup] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const seen = localStorage.getItem(`canteen_welcome_seen_${user.id}`);
      if (!seen) {
        setShowWelcomePopup(true);
        localStorage.setItem(`canteen_welcome_seen_${user.id}`, "true");
      }
    }

    const todayObj = new Date();
    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    const today = todayObj.toISOString().split("T")[0];

    const loadAll = async () => {
      const { data: state } = await supabase
        .from("admin_state")
        .select("canteen_open, menu_items, biryani_active, biryani_end, biryani_closed")
        .eq("date", today)
        .maybeSingle();

      if (state) {
        setMenuToday(state.menu_items || []);
        setCanteenOpen(!!state.canteen_open);
        setBiryaniAvailable(!!state.biryani_active);
        setBiryaniEnded(!!state.biryani_end);
        setBiryaniClosed(!!state.biryani_closed); // ✅ NEW
      } else {
        setMenuToday([]);
        setCanteenOpen(false);
        setBiryaniAvailable(false);
        setBiryaniEnded(false);
        setBiryaniClosed(false); // ✅ NEW
      }

      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .limit(1);

      setMyOrder(orders?.[0] || null);

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

    loadAll();
    const interval = setInterval(loadAll, 3000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // ✅ Show popup only once, only for users with a pending (not completed) order
  useEffect(() => {
    if (!biryaniEnded) return;
    if (!myOrder || myOrder.completed) return; // only pending order users

    const today = new Date().toLocaleDateString("en-CA");
    const seenKey = `biryani_end_popup_seen_${user?.id}_${today}`;
    const alreadySeen = localStorage.getItem(seenKey);
    if (alreadySeen) return; // already shown once today

    setShowBiryaniEndPopup(true);
    localStorage.setItem(seenKey, "true");
  }, [biryaniEnded, myOrder]);

  const orderBiryani = async () => {
    setError("");

    // ✅ CASE 1: Orders closed + user has an existing order → show popup
    if (biryaniClosed && myOrder) {
      setShowOrderLockedPopup(true);
      return;
    }

    // ✅ CASE 2: Orders closed + user has NO order → show "closed" popup (auto-hide after 3s)
    if (biryaniClosed && !myOrder) {
      setShowBiryaniClosedPopup(true);
      setTimeout(() => setShowBiryaniClosedPopup(false), 3000);
      return;
    }

    if (!biryaniAvailable || biryaniEnded) {
      setShowBiryaniOverPopup(true);
      return;
    }

    const todayObj = new Date();
    todayObj.setMinutes(todayObj.getMinutes() - todayObj.getTimezoneOffset());
    const today = todayObj.toISOString().split("T")[0];

    const { data: userProfile } = await supabase
      .from("users")
      .select("name, phone")
      .eq("id", user!.id)
      .single();

    if (!userProfile) {
      setError("User profile not found");
      return;
    }

    if (myOrder) {
      await supabase.from("orders").delete().eq("id", myOrder.id);
      setMyOrder(null);
      setShowOrderCancelledPopup(true);
      setTimeout(() => setShowOrderCancelledPopup(false), 3000);
      return;
    }

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
      setTimeout(() => setError(""), 3000);
    } else {
      setMyOrder(data);
      setShowOrderPlacedPopup(true);
      setTimeout(() => setShowOrderPlacedPopup(false), 3500);
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
            border: "2px solid #dc3545",
          }}
        >
          Canteen Closed Today 🚫
        </div>
      )}

      {canteenOpen && (
        <>
          {menuToday.length > 0 && (
            <h4 className="menu-heading-ui">Today's Menu</h4>
          )}

          {menuToday.length === 0 ? (
            <div
              style={{
                marginTop: 30,
                padding: 24,
                background: "#fff7e6",
                borderRadius: 16,
                textAlign: "center",
              }}
            >
              <img
                src="/cooking.gif"
                alt="Cooking..."
                style={{ width: 160, height: 160, objectFit: "contain", marginBottom: 12 }}
              />
              <div>Food is being prepared 👨‍🍳</div>
            </div>
          ) : (
            <div className="menu-list-ui">
              {menuToday.map((item) => (
                <div className="menu-card-ui" key={item}>
                  <img src={menuImages[item]} className="menu-img-ui" />
                  <div className="menu-title-footer-ui">
                    <span>{item}</span>
                    <span className="menu-price-ui">
                      ₹{MENU_PRICES[item] ?? "--"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ✅ Show biryani card whenever biryani is active — ended or not */}
          {biryaniAvailable && (
            <div className="order-card-ui">
              <img src="/biryani.jpg" className="biryani-img-ui" />

              {/* ── ENDED STATE ── */}
              {biryaniEnded ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>

                  {/* ✅ Disabled "Biryani Completed" button */}
                  <button
                    disabled
                    style={{
                      width: "100%",
                      background: "#28a745",
                      color: "#fff",
                      border: "none",
                      padding: 14,
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 18,
                      opacity: 0.85,
                      cursor: "not-allowed",
                      marginBottom: 12,
                    }}
                  >
                    Biryani Completed 🍛
                  </button>

                  {/* ✅ Message based on order status */}
                  {myOrder ? (
                    <div
                      style={{
                        background: myOrder.completed ? "#eafff1" : "#fff3cd",
                        border: `1px solid ${myOrder.completed ? "#28a745" : "#ffc107"}`,
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 14,
                        fontWeight: 600,
                        color: myOrder.completed ? "#1a7a3a" : "#856404",
                      }}
                    >
                      {myOrder.completed
                        ? `✅ Your order (${myOrder.quantity} plate(s)) is completed!`
                        : `⏳ Your order (${myOrder.quantity} plate(s)) is still pending — come soon!`}
                    </div>
                  ) : (
                    <div style={{ fontSize: 14, color: "#888", fontWeight: 600 }}>
                      Better luck next time 🙏
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* ── NORMAL / CLOSED STATE ── */}

                  {/* Banner: orders closed */}
                  {biryaniClosed && (
                    <div
                      style={{
                        background: "#6f42c1",
                        color: "#fff",
                        borderRadius: 10,
                        padding: "10px 14px",
                        fontWeight: 700,
                        fontSize: 15,
                        textAlign: "center",
                        marginBottom: 12,
                      }}
                    >
                      🚫 Biryani ordering is currently closed
                    </div>
                  )}

                  {/* Row 1: Quantity (always shown) LEFT + Message RIGHT */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    {/* Quantity — always visible */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                      <span style={{ fontWeight: 700 }}>{quantity}</span>
                      <button onClick={() => setQuantity(q => Math.min(3, q + 1))}>+</button>
                    </div>

                    {/* Message on right — error only, no layout shift */}
                    <div style={{ minWidth: 0 }}>
                      {error && (
                        <span style={{ color: "#856404", fontWeight: 700, fontSize: 13, background: "#fff3cd", borderRadius: 6, padding: "3px 10px" }}>
                          ⚠️ {error}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Order/Cancel button */}
                  <button
                    onClick={orderBiryani}
                    style={{
                      width: "100%",
                      border: "none",
                      padding: 14,
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 18,
                      background: biryaniClosed ? "#aaa" : myOrder ? "#dc3545" : "#ffc107",
                      color: biryaniClosed ? "#fff" : myOrder ? "#fff" : "#000",
                    }}
                  >
                    {myOrder && biryaniClosed
                      ? "Order Locked 🔒"
                      : !myOrder && biryaniClosed
                      ? "Orders Closed"
                      : myOrder
                      ? "Cancel Biryani"
                      : "Order Biryani"}
                  </button>
                </>
              )}
            </div>
          )}

          {myOrder && (
            <div className="order-confirm-card" style={{ alignItems: "center" }}>
              {/* Left: details */}
              <div className="order-confirm-info">
                <p><b>Name:</b> {myOrder.user_name}</p>
                <p><b>Quantity:</b> {myOrder.quantity}</p>
                <p><b>Status:</b> {myOrder.completed ? "Completed ✅" : "Pending 🕒"}</p>
              </div>

              {/* Right: confirmed.png when ordered, completed.png when completed */}
              <img
                src={myOrder.completed ? "/completed.png" : "/confirmed.png"}
                alt="order status"
                className="order-confirm-img"
                style={{ transition: "opacity 0.4s ease" }}
              />
            </div>
          )}
        </>
      )}

      {/* 🎉 Order Placed Popup with confetti */}
      {showOrderPlacedPopup && (
        <div
          className="popup-overlay"
          onClick={() => setShowOrderPlacedPopup(false)}
          style={{ zIndex: 999999 }}
        >
          {/* Confetti pieces */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "fixed",
                top: "-10px",
                left: `${Math.random() * 100}%`,
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                background: ["#ffc107", "#28a745", "#dc3545", "#007bff", "#ff69b4", "#ff6600", "#a855f7"][Math.floor(Math.random() * 7)],
                animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.8}s forwards`,
                pointerEvents: "none",
              }}
            />
          ))}

          <style>{`
            @keyframes confettiFall {
              0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
            }
            @keyframes popupBounce {
              0%   { transform: scale(0.5); opacity: 0; }
              60%  { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1);   opacity: 1; }
            }
          `}</style>

          <div
            className="popup-card"
            style={{ animation: "popupBounce 0.5s ease forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 48, marginBottom: 4 }}>🎉</div>
            <h3 style={{ color: "#28a745", fontSize: 22, margin: "0 0 6px" }}>Hurray!</h3>
            <p style={{ fontWeight: 600, color: "#333" }}>Your biryani order is placed!</p>
            <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Come on time and enjoy 🍛</p>
            <button
              onClick={() => setShowOrderPlacedPopup(false)}
              style={{ background: "#28a745", marginTop: 14 }}
            >
              Yay! 🎊
            </button>
          </div>
        </div>
      )}

      {/* ❌ Order Cancelled Popup */}
      {showOrderCancelledPopup && (
        <div className="popup-overlay" onClick={() => setShowOrderCancelledPopup(false)}>
          <div className="popup-card">
            <div style={{ fontSize: 40, marginBottom: 4 }}>😔</div>
            <h3 style={{ color: "#dc3545", margin: "0 0 6px" }}>Order Cancelled</h3>
            <p style={{ fontWeight: 600, color: "#555" }}>Your biryani order has been cancelled.</p>
            <button
              onClick={() => setShowOrderCancelledPopup(false)}
              style={{ background: "#dc3545", marginTop: 14 }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ✅ Order Locked Popup — when user tries to cancel after close orders */}
      {showOrderLockedPopup && (
        <div className="popup-overlay" onClick={() => setShowOrderLockedPopup(false)}>
          <div className="popup-card">
            <h3>🔒 Order Locked</h3>
            <p>Your order cannot be cancelled once orders are closed by the canteen.</p>
            <button onClick={() => setShowOrderLockedPopup(false)}>OK</button>
          </div>
        </div>
      )}

      {/* Biryani Over Popup (biryani_end) — triggered by admin clicking End button */}
      {showBiryaniEndPopup && (
        <div className="popup-overlay" onClick={() => setShowBiryaniEndPopup(false)}>
          <div className="popup-card">
            <img
              src="/biryani.jpg"
              style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", marginBottom: 10 }}
            />
            <h3>🍛 Biryani is Almost Over!</h3>
            <p style={{ marginTop: 6 }}>
              Come soon — biryani is running out!<br />
              <span style={{ fontSize: 13, color: "#888" }}>Better luck next time 🙏</span>
            </p>
            <button onClick={() => setShowBiryaniEndPopup(false)}>OK</button>
          </div>
        </div>
      )}

      {/* showBiryaniOverPopup — fallback if someone clicks order when ended */}
      {showBiryaniOverPopup && (
        <div className="popup-overlay" onClick={() => setShowBiryaniOverPopup(false)}>
          <div className="popup-card">
            <h3>🍛 Biryani Over</h3>
            <p>Biryani ordering is closed by canteen.</p>
            <button onClick={() => setShowBiryaniOverPopup(false)}>OK</button>
          </div>
        </div>
      )}

      {/* ✅ NEW: Biryani Closed Popup (biryani_closed) */}
      {showBiryaniClosedPopup && (
        <div className="popup-overlay" onClick={() => setShowBiryaniClosedPopup(false)}>
          <div className="popup-card">
            <h3>🚫 Biryani Orders Closed</h3>
            <p>Biryani orders are currently closed. Please contact the canteen directly.</p>
            <p style={{ marginTop: 8, fontWeight: 700, color: "#333" }}>
              📞 +91 96665 72449
            </p>
            <button onClick={() => setShowBiryaniClosedPopup(false)}>OK</button>
          </div>
        </div>
      )}

      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h2>Welcome to IIMR Canteen 🍽️</h2>
            <button onClick={() => setShowWelcomePopup(false)}>OK</button>
          </div>
        </div>
      )}

      {/* ✅ Canteen Info Note — always visible */}
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

      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          position: "fixed",
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "#f9f7f4",
          padding: "12px 16px",
        }}
      >
        <strong>{profile?.name ?? user?.email}</strong>

        <button
          style={{
            background: "#dc3545",
            color: "#fff",
            borderRadius: 8,
            padding: "8px 18px",
            border: "none",
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