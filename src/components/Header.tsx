import { useNavigate } from "react-router-dom";
import "../styles/Header.css";

const Header = () => {
  const navigate = useNavigate();
  // Get today's date and day
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const dayStr = today.toLocaleDateString("en-IN", { weekday: "long" });
  
  return (
    <header className="premium-header">
      <div className="header-container">
        <div className="header-logo" onClick={() => navigate("/")}>
          <img 
            src="/logo.png" 
            alt="IIMR Canteen Logo" 
            className="logo-image"
          />
        </div>
        <div className="header-date">
          <div className="date-text">{dateStr}</div>
          <div className="day-text">{dayStr}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;