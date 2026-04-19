import { useState, useEffect, useRef } from "react";

const GEMINI_API_KEY = "AIzaSyDemo"; // User will replace this

// Category config
const CATEGORIES = {
  Dairy: { icon: "🥛", color: "#E8F4FD", accent: "#2196F3" },
  Vegetables: { icon: "🥦", color: "#E8F5E9", accent: "#4CAF50" },
  Fruits: { icon: "🍎", color: "#FFF3E0", accent: "#FF9800" },
  Meat: { icon: "🥩", color: "#FCE4EC", accent: "#E91E63" },
  Bakery: { icon: "🍞", color: "#FFF8E1", accent: "#FFC107" },
  Beverages: { icon: "🧃", color: "#E3F2FD", accent: "#03A9F4" },
  Frozen: { icon: "🧊", color: "#E8EAF6", accent: "#3F51B5" },
  Condiments: { icon: "🧴", color: "#F3E5F5", accent: "#9C27B0" },
  Snacks: { icon: "🍿", color: "#FBE9E7", accent: "#FF5722" },
  Other: { icon: "📦", color: "#ECEFF1", accent: "#607D8B" },
};

function getDaysUntilExpiry(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function getExpiryStatus(days) {
  if (days < 0) return { label: "Expired", color: "#FF1744", bg: "#FFE5EA" };
  if (days <= 2) return { label: `${days}d left`, color: "#FF6D00", bg: "#FFF3E0" };
  if (days <= 7) return { label: `${days}d left`, color: "#F9A825", bg: "#FFFDE7" };
  return { label: `${days}d left`, color: "#2E7D32", bg: "#E8F5E9" };
}

// Mock AI extraction for demo (replace with real Gemini API)
async function extractItemFromImage(base64Image) {
  await new Promise(r => setTimeout(r, 2000));
  const mockItems = [
    { name: "Greek Yogurt", quantity: "500g", category: "Dairy", expiryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] },
    { name: "Cheddar Cheese", quantity: "250g", category: "Dairy", expiryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0] },
    { name: "Fresh Spinach", quantity: "200g", category: "Vegetables", expiryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] },
    { name: "Orange Juice", quantity: "1L", category: "Beverages", expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] },
    { name: "Sourdough Bread", quantity: "1 loaf", category: "Bakery", expiryDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0] },
    { name: "Chicken Breast", quantity: "600g", category: "Meat", expiryDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0] },
    { name: "Whole Milk", quantity: "1L", category: "Dairy", expiryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0] },
    { name: "Strawberries", quantity: "300g", category: "Fruits", expiryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] },
  ];
  return mockItems[Math.floor(Math.random() * mockItems.length)];
}

export default function KitchenBrain() {
  const [items, setItems] = useState([
    { id: 1, name: "Greek Yogurt", quantity: "500g", category: "Dairy", expiryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0] },
    { id: 2, name: "Fresh Spinach", quantity: "200g", category: "Vegetables", expiryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0] },
    { id: 3, name: "Chicken Breast", quantity: "600g", category: "Meat", expiryDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0] },
    { id: 4, name: "Whole Milk", quantity: "1L", category: "Dairy", expiryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0] },
    { id: 5, name: "Sourdough Bread", quantity: "1 loaf", category: "Bakery", expiryDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0] },
    { id: 6, name: "Strawberries", quantity: "300g", category: "Fruits", expiryDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0] },
  ]);

  const [view, setView] = useState("dashboard"); // dashboard, inventory, scan, alerts, search
  const [scanning, setScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [previewImage, setPreviewImage] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const fileRef = useRef();

  const expiringSoon = items.filter(i => {
    const d = getDaysUntilExpiry(i.expiryDate);
    return d >= 0 && d <= 2;
  });
  const expired = items.filter(i => getDaysUntilExpiry(i.expiryDate) < 0);
  const fresh = items.filter(i => getDaysUntilExpiry(i.expiryDate) > 7);

  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setPreviewImage(ev.target.result);
      setScanning(true);
      setView("scan");
      try {
        const extracted = await extractItemFromImage(ev.target.result.split(',')[1]);
        setScannedItem(extracted);
      } catch (err) {
        console.error(err);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const addScannedItem = () => {
    if (!scannedItem) return;
    const newItem = {
      id: Date.now(),
      ...scannedItem,
      addedDate: new Date().toISOString().split('T')[0],
    };
    setItems(prev => [newItem, ...prev]);
    setScannedItem(null);
    setPreviewImage(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setView("inventory");
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const styles = {
    app: {
      fontFamily: "'DM Sans', sans-serif",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f1923 0%, #1a2d1e 50%, #0f1923 100%)",
      color: "#f0f0f0",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
      overflow: "hidden",
    },
    header: {
      padding: "24px 20px 16px",
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 4,
    },
    logoIcon: {
      width: 36,
      height: 36,
      background: "linear-gradient(135deg, #4CAF50, #81C784)",
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
    },
    logoText: {
      fontSize: 22,
      fontWeight: 700,
      background: "linear-gradient(135deg, #81C784, #A5D6A7)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      letterSpacing: "-0.5px",
    },
    subtitle: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
    content: { padding: "16px 20px 100px" },
    statsRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 10,
      marginBottom: 20,
    },
    statCard: (bg, accent) => ({
      background: `rgba(255,255,255,0.05)`,
      border: `1px solid ${accent}33`,
      borderRadius: 14,
      padding: "14px 12px",
      textAlign: "center",
    }),
    statNum: (color) => ({ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }),
    statLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 600,
      color: "rgba(255,255,255,0.5)",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 12,
      marginTop: 20,
    },
    alertCard: {
      background: "linear-gradient(135deg, rgba(255,109,0,0.15), rgba(255,109,0,0.05))",
      border: "1px solid rgba(255,109,0,0.3)",
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    itemCard: (accent) => ({
      background: "rgba(255,255,255,0.04)",
      border: `1px solid rgba(255,255,255,0.08)`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }),
    catIcon: (bg) => ({
      width: 42,
      height: 42,
      background: bg,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      flexShrink: 0,
    }),
    badge: (color, bg) => ({
      background: bg,
      color: color,
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 8px",
      borderRadius: 20,
      whiteSpace: "nowrap",
    }),
    scanBtn: {
      width: "100%",
      padding: "18px",
      background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
      border: "none",
      borderRadius: 16,
      color: "#fff",
      fontSize: 16,
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      boxShadow: "0 8px 24px rgba(76,175,80,0.3)",
      marginBottom: 16,
    },
    nav: {
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 480,
      background: "rgba(15,25,35,0.95)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      padding: "8px 0 16px",
    },
    navBtn: (active) => ({
      flex: 1,
      background: "none",
      border: "none",
      color: active ? "#4CAF50" : "rgba(255,255,255,0.35)",
      fontSize: 10,
      fontWeight: active ? 700 : 400,
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      padding: "8px 0",
      transition: "all 0.2s",
    }),
    searchBar: {
      width: "100%",
      padding: "12px 16px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12,
      color: "#fff",
      fontSize: 14,
      outline: "none",
      marginBottom: 14,
      boxSizing: "border-box",
    },
    catPill: (active) => ({
      padding: "6px 14px",
      borderRadius: 20,
      border: `1px solid ${active ? "#4CAF50" : "rgba(255,255,255,0.1)"}`,
      background: active ? "rgba(76,175,80,0.2)" : "transparent",
      color: active ? "#4CAF50" : "rgba(255,255,255,0.5)",
      fontSize: 12,
      fontWeight: active ? 700 : 400,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }),
    successToast: {
      position: "fixed",
      top: 20,
      left: "50%",
      transform: "translateX(-50%)",
      background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
      color: "#fff",
      padding: "12px 24px",
      borderRadius: 30,
      fontSize: 14,
      fontWeight: 600,
      zIndex: 1000,
      boxShadow: "0 8px 24px rgba(76,175,80,0.4)",
    },
    scanArea: {
      background: "rgba(255,255,255,0.04)",
      border: "2px dashed rgba(76,175,80,0.4)",
      borderRadius: 20,
      padding: 32,
      textAlign: "center",
      marginBottom: 20,
      cursor: "pointer",
    },
  };

  const renderDashboard = () => (
    <div>
      <div style={styles.statsRow}>
        <div style={styles.statCard("#FCE4EC", "#E91E63")}>
          <div style={styles.statNum("#FF1744")}>{expired.length}</div>
          <div style={styles.statLabel}>Expired</div>
        </div>
        <div style={styles.statCard("#FFF3E0", "#FF9800")}>
          <div style={styles.statNum("#FF6D00")}>{expiringSoon.length}</div>
          <div style={styles.statLabel}>Expiring Soon</div>
        </div>
        <div style={styles.statCard("#E8F5E9", "#4CAF50")}>
          <div style={styles.statNum("#2E7D32")}>{items.length}</div>
          <div style={styles.statLabel}>Total Items</div>
        </div>
      </div>

      <button style={styles.scanBtn} onClick={() => fileRef.current.click()}>
        📸 Scan New Item
      </button>

      {(expired.length > 0 || expiringSoon.length > 0) && (
        <>
          <div style={styles.sectionTitle}>⚠️ Needs Attention</div>
          {[...expired, ...expiringSoon].slice(0, 4).map(item => {
            const days = getDaysUntilExpiry(item.expiryDate);
            const status = getExpiryStatus(days);
            const cat = CATEGORIES[item.category] || CATEGORIES.Other;
            return (
              <div key={item.id} style={styles.alertCard}>
                <div style={styles.catIcon(cat.color)}>{cat.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{item.quantity}</div>
                </div>
                <span style={styles.badge(status.color, status.bg)}>{status.label}</span>
              </div>
            );
          })}
        </>
      )}

      <div style={styles.sectionTitle}>📦 Recent Items</div>
      {items.slice(0, 4).map(item => {
        const days = getDaysUntilExpiry(item.expiryDate);
        const status = getExpiryStatus(days);
        const cat = CATEGORIES[item.category] || CATEGORIES.Other;
        return (
          <div key={item.id} style={styles.itemCard(cat.accent)}>
            <div style={styles.catIcon(cat.color)}>{cat.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{item.category} · {item.quantity}</div>
            </div>
            <span style={styles.badge(status.color, status.bg)}>{status.label}</span>
          </div>
        );
      })}
    </div>
  );

  const renderScan = () => (
    <div>
      <div style={styles.sectionTitle}>📸 Scan Item</div>
      {previewImage && (
        <img src={previewImage} alt="Preview" style={{ width: "100%", borderRadius: 16, marginBottom: 16, maxHeight: 200, objectFit: "cover" }} />
      )}
      {scanning && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#4CAF50" }}>AI is reading your item...</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>Detecting name, category & expiry date</div>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 6 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%", background: "#4CAF50",
                animation: `pulse 1s ${i * 0.3}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}
      {scannedItem && !scanning && (
        <div>
          <div style={{ background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#4CAF50", fontWeight: 600, marginBottom: 12 }}>✅ AI detected:</div>
            {[
              ["🏷️ Name", scannedItem.name],
              ["📦 Quantity", scannedItem.quantity],
              ["📁 Category", `${CATEGORIES[scannedItem.category]?.icon} ${scannedItem.category}`],
              ["📅 Expires", scannedItem.expiryDate],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{label}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{value}</span>
              </div>
            ))}
          </div>
          <button onClick={addScannedItem} style={styles.scanBtn}>
            ✅ Add to Kitchen
          </button>
          <button onClick={() => { setScannedItem(null); setPreviewImage(null); setView("dashboard"); }}
            style={{ ...styles.scanBtn, background: "rgba(255,255,255,0.08)", boxShadow: "none" }}>
            ❌ Cancel
          </button>
        </div>
      )}
      {!previewImage && !scanning && (
        <div style={styles.scanArea} onClick={() => fileRef.current.click()}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Take a Photo</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>AI will automatically detect the item name, category and expiry date</div>
        </div>
      )}
    </div>
  );

  const renderInventory = () => (
    <div>
      <input
        style={styles.searchBar}
        placeholder="🔍  Search your kitchen..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 4 }}>
        {["All", ...Object.keys(CATEGORIES)].map(cat => (
          <button key={cat} style={styles.catPill(selectedCategory === cat)} onClick={() => setSelectedCategory(cat)}>
            {cat !== "All" ? CATEGORIES[cat]?.icon + " " : ""}{cat}
          </button>
        ))}
      </div>
      <div style={styles.sectionTitle}>{filteredItems.length} items</div>
      {filteredItems.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize: 40 }}>🔍</div>
          <div style={{ marginTop: 12 }}>No items found</div>
        </div>
      )}
      {filteredItems.map(item => {
        const days = getDaysUntilExpiry(item.expiryDate);
        const status = getExpiryStatus(days);
        const cat = CATEGORIES[item.category] || CATEGORIES.Other;
        return (
          <div key={item.id} style={styles.itemCard(cat.accent)}>
            <div style={styles.catIcon(cat.color)}>{cat.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{item.quantity} · {item.expiryDate}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <span style={styles.badge(status.color, status.bg)}>{status.label}</span>
              <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 14 }}>🗑️</button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderAlerts = () => {
    const urgentItems = items
      .map(i => ({ ...i, days: getDaysUntilExpiry(i.expiryDate) }))
      .filter(i => i.days <= 7)
      .sort((a, b) => a.days - b.days);

    return (
      <div>
        <div style={styles.sectionTitle}>🔔 Expiry Alerts</div>
        {urgentItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>All good!</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>No items expiring soon</div>
          </div>
        ) : urgentItems.map(item => {
          const status = getExpiryStatus(item.days);
          const cat = CATEGORIES[item.category] || CATEGORIES.Other;
          return (
            <div key={item.id} style={{ ...styles.alertCard, borderColor: `${status.color}44`, background: `${status.bg}22` }}>
              <div style={styles.catIcon(cat.color)}>{cat.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Expires: {item.expiryDate}</div>
                {item.days <= 2 && item.days >= 0 && (
                  <div style={{ fontSize: 12, color: "#FF9800", marginTop: 4 }}>💡 Use soon to avoid waste!</div>
                )}
                {item.days < 0 && (
                  <div style={{ fontSize: 12, color: "#FF1744", marginTop: 4 }}>❌ Please discard this item</div>
                )}
              </div>
              <span style={styles.badge(status.color, status.bg)}>{status.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
      `}</style>

      {showSuccess && (
        <div style={styles.successToast}>✅ Item added to your kitchen!</div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleImageUpload} />

      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🧠</div>
          <div style={styles.logoText}>Kitchen Brain</div>
        </div>
        <div style={styles.subtitle}>AI-powered kitchen manager · {items.length} items tracked</div>
      </div>

      <div style={styles.content}>
        {view === "dashboard" && renderDashboard()}
        {view === "scan" && renderScan()}
        {view === "inventory" && renderInventory()}
        {view === "alerts" && renderAlerts()}
      </div>

      <nav style={styles.nav}>
        {[
          { id: "dashboard", icon: "🏠", label: "Home" },
          { id: "inventory", icon: "📦", label: "Inventory" },
          { id: "scan", icon: "📸", label: "Scan" },
          { id: "alerts", icon: `🔔${expiringSoon.length + expired.length > 0 ? ` ${expiringSoon.length + expired.length}` : ""}`, label: "Alerts" },
        ].map(tab => (
          <button key={tab.id} style={styles.navBtn(view === tab.id)} onClick={() => setView(tab.id)}>
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
