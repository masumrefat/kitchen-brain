// =====================
// Kitchen Brain - Views
// =====================

function renderItemCard(item, showDelete = true) {
  const days = getDaysUntilExpiry(item.expiryDate);
  const status = getExpiryStatus(days);
  const cat = CATEGORIES[item.category] || CATEGORIES.Other;

  return `
    <div class="item-card" style="border-left: 3px solid ${cat.accent}">
      <div class="cat-icon" style="background:${cat.bg}">${cat.icon}</div>
      <div class="item-info">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-meta">${escapeHtml(item.category)} · ${escapeHtml(item.quantity)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <span class="badge" style="color:${status.color};background:${status.bg}">${status.label}</span>
        ${showDelete ? `<button class="delete-btn" onclick="deleteItem(${item.id})" title="Remove">🗑️</button>` : ""}
      </div>
    </div>`;
}

function renderAlertCard(item) {
  const days = getDaysUntilExpiry(item.expiryDate);
  const status = getExpiryStatus(days);
  const cat = CATEGORIES[item.category] || CATEGORIES.Other;
  const tip = days < 0
    ? `<div style="font-size:12px;color:#FF1744;margin-top:4px">❌ Please discard this item</div>`
    : days <= 2
    ? `<div style="font-size:12px;color:#FF9800;margin-top:4px">💡 Use soon to avoid waste!</div>`
    : "";

  return `
    <div class="alert-card" style="border-color:${status.color}44;background:${status.bg}">
      <div class="cat-icon" style="background:${cat.bg}">${cat.icon}</div>
      <div class="item-info">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-meta">Expires: ${item.expiryDate} · ${escapeHtml(item.quantity)}</div>
        ${tip}
      </div>
      <span class="badge" style="color:${status.color};background:${status.bg}">${status.label}</span>
    </div>`;
}

function renderDashboard() {
  const { items } = state;
  const expired     = items.filter(i => getDaysUntilExpiry(i.expiryDate) < 0);
  const expiringSoon = items.filter(i => { const d = getDaysUntilExpiry(i.expiryDate); return d >= 0 && d <= 2; });
  const urgent      = [...expired, ...expiringSoon];
  const meals       = getMealSuggestions(items);

  return `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-num red">${expired.length}</div>
        <div class="stat-label">Expired</div>
      </div>
      <div class="stat-card">
        <div class="stat-num orange">${expiringSoon.length}</div>
        <div class="stat-label">Expiring Soon</div>
      </div>
      <div class="stat-card">
        <div class="stat-num green">${items.length}</div>
        <div class="stat-label">Total Items</div>
      </div>
    </div>

    <button class="scan-btn" onclick="triggerScan()">📸 Scan New Item</button>

    ${!state.apiKey ? `
    <div class="setup-card">
      <div class="setup-title">🔑 Connect Real AI</div>
      <div class="setup-sub">Add your free Gemini API key to enable real photo scanning. Get one free at <a href="https://aistudio.google.com" target="_blank" style="color:#4CAF50">aistudio.google.com</a></div>
      <input class="api-input" id="api-key-input" placeholder="Paste your Gemini API key..." type="password" />
      <button class="api-save-btn" onclick="saveApiKeyFromInput()">Save Key</button>
    </div>` : `
    <div style="background:rgba(76,175,80,0.08);border:1px solid rgba(76,175,80,0.2);border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:13px;color:#4CAF50">✅ AI Connected (Gemini)</span>
      <button onclick="clearApiKey()" style="background:none;border:none;color:rgba(255,255,255,0.3);font-size:12px;cursor:pointer">Disconnect</button>
    </div>`}

    ${urgent.length > 0 ? `
    <div class="section-title">⚠️ Needs Attention</div>
    ${urgent.slice(0,4).map(renderAlertCard).join("")}` : ""}

    ${meals.length > 0 ? `
    <div class="section-title">🍳 Use Before They Expire</div>
    ${meals.map(m => `
      <div class="meal-card">
        <div class="meal-title">${m.title}</div>
        <div class="meal-ingredients">Uses: ${m.uses}</div>
      </div>`).join("")}` : ""}

    <div class="section-title">📦 Recent Items</div>
    ${items.slice(0,5).map(i => renderItemCard(i)).join("")}
    ${items.length > 5 ? `<div style="text-align:center;padding:12px;color:rgba(255,255,255,0.3);font-size:13px">+ ${items.length - 5} more items · <a href="#" onclick="switchView('inventory');return false" style="color:#4CAF50">View all</a></div>` : ""}
  `;
}

function renderInventory() {
  const { items, searchQuery, selectedCategory } = state;

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const cats = ["All", ...Object.keys(CATEGORIES)];

  return `
    <input class="search-bar" placeholder="🔍  Search your kitchen..."
      value="${escapeHtml(searchQuery)}"
      oninput="state.searchQuery=this.value;renderView()"
    />
    <div class="cat-pills">
      ${cats.map(cat => `
        <button class="cat-pill ${selectedCategory === cat ? "active" : ""}"
          onclick="state.selectedCategory='${cat}';renderView()">
          ${cat !== "All" ? CATEGORIES[cat]?.icon + " " : ""}${cat}
        </button>`).join("")}
    </div>
    <div class="section-title">${filtered.length} item${filtered.length !== 1 ? "s" : ""}</div>
    ${filtered.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No items found</div>
        <div class="empty-sub">Try a different search or category</div>
      </div>` : filtered.map(i => renderItemCard(i)).join("")}
  `;
}

function renderScan() {
  const { scanning, scannedItem, previewImage } = state;

  if (scanning) {
    return `
      ${previewImage ? `<img src="${previewImage}" class="preview-img" alt="Preview" />` : ""}
      <div class="scanning-box">
        <div class="scanning-icon">🔍</div>
        <div class="scanning-title">AI is reading your item...</div>
        <div class="scanning-sub">Detecting name, category & expiry date</div>
        <div class="dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>`;
  }

  if (scannedItem) {
    const cat = CATEGORIES[scannedItem.category] || CATEGORIES.Other;
    return `
      ${previewImage ? `<img src="${previewImage}" class="preview-img" alt="Preview" />` : ""}
      <div class="detected-box">
        <div class="detected-label">✅ AI detected your item:</div>
        <div class="detected-row">
          <span class="detected-key">🏷️ Name</span>
          <span class="detected-val">${escapeHtml(scannedItem.name)}</span>
        </div>
        <div class="detected-row">
          <span class="detected-key">📦 Quantity</span>
          <span class="detected-val">${escapeHtml(scannedItem.quantity)}</span>
        </div>
        <div class="detected-row">
          <span class="detected-key">📁 Category</span>
          <span class="detected-val">${cat.icon} ${escapeHtml(scannedItem.category)}</span>
        </div>
        <div class="detected-row">
          <span class="detected-key">📅 Expires</span>
          <span class="detected-val">${scannedItem.expiryDate}</span>
        </div>
        ${scannedItem.confidence ? `
        <div class="detected-row">
          <span class="detected-key">🎯 Confidence</span>
          <span class="detected-val" style="color:${scannedItem.confidence==='high'?'#4CAF50':'#FF9800'}">${scannedItem.confidence}</span>
        </div>` : ""}
      </div>
      <button class="scan-btn" onclick="addScannedItem()">✅ Add to Kitchen</button>
      <button class="scan-btn secondary" onclick="cancelScan()">❌ Cancel</button>
    `;
  }

  const demoMode = !state.apiKey;
  return `
    <div class="scan-area" onclick="document.getElementById('file-input').click()">
      <div class="scan-area-icon">📷</div>
      <div class="scan-area-title">Take a Photo</div>
      <div class="scan-area-sub">
        AI will automatically detect the item name,<br>category and expiry date
        ${demoMode ? "<br><br><span style='color:#FF9800;font-size:12px'>⚠️ Demo mode — add API key for real scanning</span>" : ""}
      </div>
    </div>
    <button class="scan-btn" onclick="document.getElementById('file-input').click()">📸 Choose Photo</button>
  `;
}

function renderAlerts() {
  const { items } = state;
  const urgent = items
    .map(i => ({ ...i, days: getDaysUntilExpiry(i.expiryDate) }))
    .filter(i => i.days <= 7)
    .sort((a, b) => a.days - b.days);

  if (urgent.length === 0) {
    return `
      <div class="empty-state" style="padding-top:80px">
        <div class="empty-icon">✅</div>
        <div class="empty-title">All good!</div>
        <div class="empty-sub">No items expiring in the next 7 days</div>
      </div>`;
  }

  return `
    <div class="section-title">🔔 ${urgent.length} item${urgent.length !== 1 ? "s" : ""} need attention</div>
    ${urgent.map(renderAlertCard).join("")}
  `;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
