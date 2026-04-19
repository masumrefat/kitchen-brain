// =====================
// Kitchen Brain - Data
// =====================

const CATEGORIES = {
  Dairy:      { icon: "🥛", bg: "#dbeafe", accent: "#2196F3" },
  Vegetables: { icon: "🥦", bg: "#dcfce7", accent: "#4CAF50" },
  Fruits:     { icon: "🍎", bg: "#fef3c7", accent: "#FF9800" },
  Meat:       { icon: "🥩", bg: "#fce7f3", accent: "#E91E63" },
  Bakery:     { icon: "🍞", bg: "#fef9c3", accent: "#FFC107" },
  Beverages:  { icon: "🧃", bg: "#e0f2fe", accent: "#03A9F4" },
  Frozen:     { icon: "🧊", bg: "#ede9fe", accent: "#3F51B5" },
  Condiments: { icon: "🧴", bg: "#f3e8ff", accent: "#9C27B0" },
  Snacks:     { icon: "🍿", bg: "#ffedd5", accent: "#FF5722" },
  Other:      { icon: "📦", bg: "#f1f5f9", accent: "#607D8B" },
};

const STORAGE_KEY = "kitchen_brain_items";
const API_KEY_STORAGE = "kitchen_brain_api_key";

// Load items from localStorage
function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  // Default demo items
  return [
    { id: 1, name: "Greek Yogurt",    quantity: "500g",   category: "Dairy",      expiryDate: daysFromNow(2),  addedDate: today() },
    { id: 2, name: "Fresh Spinach",   quantity: "200g",   category: "Vegetables", expiryDate: daysFromNow(3),  addedDate: today() },
    { id: 3, name: "Chicken Breast",  quantity: "600g",   category: "Meat",       expiryDate: daysFromNow(1),  addedDate: today() },
    { id: 4, name: "Whole Milk",      quantity: "1L",     category: "Dairy",      expiryDate: daysFromNow(10), addedDate: today() },
    { id: 5, name: "Sourdough Bread", quantity: "1 loaf", category: "Bakery",     expiryDate: daysFromNow(4),  addedDate: today() },
    { id: 6, name: "Strawberries",    quantity: "300g",   category: "Fruits",     expiryDate: daysFromNow(-1), addedDate: today() },
    { id: 7, name: "Orange Juice",    quantity: "1L",     category: "Beverages",  expiryDate: daysFromNow(7),  addedDate: today() },
    { id: 8, name: "Cheddar Cheese",  quantity: "250g",   category: "Dairy",      expiryDate: daysFromNow(5),  addedDate: today() },
  ];
}

function saveItems(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
}

function loadApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || "";
}

function saveApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function getDaysUntilExpiry(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const exp = new Date(dateStr); exp.setHours(0,0,0,0);
  return Math.ceil((exp - now) / 86400000);
}

function getExpiryStatus(days) {
  if (days < 0)  return { label: "Expired",     color: "#FF1744", bg: "rgba(255,23,68,0.15)"   };
  if (days === 0) return { label: "Today!",      color: "#FF1744", bg: "rgba(255,23,68,0.15)"   };
  if (days <= 2) return { label: `${days}d left`, color: "#FF6D00", bg: "rgba(255,109,0,0.15)" };
  if (days <= 7) return { label: `${days}d left`, color: "#F9A825", bg: "rgba(249,168,37,0.15)" };
  return           { label: `${days}d left`, color: "#4CAF50", bg: "rgba(76,175,80,0.15)"  };
}

function getMealSuggestions(items) {
  const expiring = items.filter(i => getDaysUntilExpiry(i.expiryDate) <= 3 && getDaysUntilExpiry(i.expiryDate) >= 0);
  const names = expiring.map(i => i.name.toLowerCase());

  const meals = [];

  if (names.some(n => n.includes("egg") || n.includes("cheese") || n.includes("spinach")))
    meals.push({ title: "🍳 Cheese & Spinach Omelette", uses: "Eggs, Cheese, Spinach" });
  if (names.some(n => n.includes("chicken") || n.includes("bread")))
    meals.push({ title: "🥪 Chicken Sandwich", uses: "Chicken Breast, Bread" });
  if (names.some(n => n.includes("yogurt") || n.includes("strawberr")))
    meals.push({ title: "🥣 Yogurt Parfait", uses: "Yogurt, Strawberries" });
  if (names.some(n => n.includes("milk") || n.includes("bread")))
    meals.push({ title: "🍞 French Toast", uses: "Milk, Bread, Eggs" });
  if (names.some(n => n.includes("spinach") || n.includes("cheese")))
    meals.push({ title: "🥗 Spinach Salad", uses: "Spinach, Cheese" });
  if (expiring.length > 0 && meals.length === 0)
    meals.push({ title: "🍲 Use-It-Up Stir Fry", uses: expiring.slice(0,3).map(i => i.name).join(", ") });

  return meals.slice(0, 3);
}

// App state
let state = {
  items: loadItems(),
  view: "dashboard",
  scanning: false,
  scannedItem: null,
  previewImage: null,
  searchQuery: "",
  selectedCategory: "All",
  apiKey: loadApiKey(),
};
