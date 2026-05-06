const categories = ["All", "Tropical", "Citrus", "Berry", "Stone", "Pome", "Melon"];

export default function LeftSidebar({
  search,
  setSearch,
  setScanLocked,
  onUpload,
  onStartScanner,     // ✅ added
  detectionStatus,
  activeCategory,
  setActiveCategory,
  voice,
  isListening
}) {
  return (
    <aside className="sidebar">

      {/* 🔍 Search with Mic */}
      <div className="card search-card">
        <div className="search-wrapper">
          <input
            className="search-input"
            placeholder="Search fruits..."
            value={search}
            onChange={e => {
  setSearch(e.target.value);
  setScanLocked(false); // 🔓 IMPORTANT
}}
          />

          <button
            type="button"
            className={`mic-button ${isListening ? "listening" : ""}`}
            onClick={voice}
            title="Voice search"
          >
            <img
              src="/icons/mic.png"
              alt="Voice search"
              className="mic-icon"
            />
          </button>
        </div>
      </div>

      {/* 📸 Upload & Scanner */}
      <div className="card upload-card">
        <label className="outline-btn upload-btn">
          ⬆ Upload Photo
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={onUpload}
          />
        </label>

        {/* ✅ WORKING SCANNER BUTTON */}
        <button
          className="outline-btn"
          type="button"
          onClick={onStartScanner}
        >
          📷 Start Scanner
        </button>

        {detectionStatus && (
          <div className="detect-status">{detectionStatus}</div>
        )}
      </div>

      {/* 🧩 Categories */}
      <div className="card category-card">
        <h4 className="panel-title">Categories</h4>

        <div className="category-list">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-item ${
                activeCategory === cat ? "active" : ""
              }`}
              onClick={() => {
  setActiveCategory(cat);
  setScanLocked(false); 
}}

            >
              {cat}
            </button>
          ))}
        </div>
      </div>

    </aside>
  );
}
