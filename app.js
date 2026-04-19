// =====================
// Kitchen Brain - App
// =====================

function renderView() {
  const content = document.getElementById("content");
  const { view } = state;

  switch (view) {
    case "dashboard": content.innerHTML = renderDashboard(); break;
    case "inventory": content.innerHTML = renderInventory(); break;
    case "scan":      content.innerHTML = renderScan();      break;
    case "alerts":    content.innerHTML = renderAlerts();    break;
    default:          content.innerHTML = renderDashboard();
  }

  updateNav();
  updateHeader();
}

function updateNav() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === state.view);
  });

  // Update alert badge
  const expired      = state.items.filter(i => getDaysUntilExpiry(i.expiryDate) < 0);
  const expiringSoon = state.items.filter(i => { const d = getDaysUntilExpiry(i.expiryDate); return d >= 0 && d <= 2; });
  const count        = expired.length + expiringSoon.length;
  const label        = document.getElementById("alert-label");
  if (label) label.textContent = count > 0 ? `Alerts ${count}` : "Alerts";
}

function updateHeader() {
  const el = document.getElementById("item-count");
  if (el) el.textContent = `${state.items.length} item${state.items.length !== 1 ? "s" : ""}`;
}

function switchView(view) {
  state.view = view;
  state.searchQuery = "";
  state.selectedCategory = "All";
  renderView();
  window.scrollTo(0, 0);
}

function triggerScan() {
  state.view = "scan";
  state.scannedItem = null;
  state.previewImage = null;
  renderView();
  // Small delay so scan view renders first
  setTimeout(() => document.getElementById("file-input").click(), 100);
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (ev) => {
    state.previewImage = ev.target.result;
    state.scanning = true;
    state.view = "scan";
    renderView();

    try {
      const base64 = ev.target.result.split(",")[1];
      const item = await extractItemFromImage(base64);
      state.scannedItem = item;
    } catch (err) {
      console.error("AI error:", err);
      showToast("❌ Could not read image. Try again.", "error");
      state.scannedItem = null;
      state.previewImage = null;
    } finally {
      state.scanning = false;
      renderView();
    }
  };
  reader.readAsDataURL(file);

  // Reset input so same file can be re-selected
  event.target.value = "";
}

function addScannedItem() {
  if (!state.scannedItem) return;
  const newItem = {
    id: Date.now(),
    ...state.scannedItem,
    addedDate: today(),
  };
  state.items = [newItem, ...state.items];
  saveItems(state.items);

  state.scannedItem = null;
  state.previewImage = null;

  showToast("✅ Item added to your kitchen!");
  switchView("inventory");
}

function cancelScan() {
  state.scannedItem = null;
  state.previewImage = null;
  switchView("dashboard");
}

function deleteItem(id) {
  state.items = state.items.filter(i => i.id !== id);
  saveItems(state.items);
  renderView();
}

function saveApiKeyFromInput() {
  const input = document.getElementById("api-key-input");
  if (!input) return;
  const key = input.value.trim();
  if (!key) { showToast("❌ Please enter an API key", "error"); return; }
  state.apiKey = key;
  saveApiKey(key);
  showToast("✅ API key saved! Real AI scanning enabled.");
  renderView();
}

function clearApiKey() {
  state.apiKey = "";
  localStorage.removeItem("kitchen_brain_api_key");
  renderView();
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.style.background = type === "error"
    ? "linear-gradient(135deg, #FF1744, #C62828)"
    : "linear-gradient(135deg, #4CAF50, #2E7D32)";
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  renderView();
});
