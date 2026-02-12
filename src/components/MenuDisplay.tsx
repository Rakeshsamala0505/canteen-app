import { useSelectedCurries, useSettings } from "../hooks/useData";

const MenuDisplay = () => {
  const { curries, loading } = useSelectedCurries();
  const { settings } = useSettings();

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      {settings?.canteen_closed && (
        <div className="notice notice-warning">
          🔒 The canteen is currently closed. Please try again later.
        </div>
      )}

      {settings?.special_day && (
        <div className="notice notice-info">
          🎉 Special Biryani Day! Limited quantity available. Order now!
        </div>
      )}

      {settings?.extra_plates_available > 0 && (
        <div className="notice notice-success">
          ✨ Extra {settings.extra_plates_available} plates available today!
        </div>
      )}

      <h2 style={{ marginBottom: "2rem" }}>Today's Menu</h2>

      {curries.length === 0 ? (
        <div className="notice notice-info">
          No curries available today. Please check back later!
        </div>
      ) : (
        <div className="grid">
          {curries.map((curry) => (
            <div key={curry.id} className="curry-card">
              <img
                src={curry.image_url}
                alt={curry.title}
                className="curry-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/200x200?text=Curry+Image";
                }}
              />
              <div className="curry-info">
                <h3 className="curry-title">{curry.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuDisplay;
