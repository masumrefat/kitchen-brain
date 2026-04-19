# 🧠 Kitchen Brain

> AI-powered kitchen manager — snap a photo, track everything, waste nothing.

## ✨ Features

- 📸 **Photo Scan** — Take a photo of any food item, AI reads it automatically
- 📦 **Smart Inventory** — Auto-categorizes items (Dairy, Vegetables, Meat, etc.)
- 📅 **Expiry Tracking** — Never forget what's about to go bad
- 🔔 **Smart Alerts** — Get notified 2 days before items expire
- 🔍 **Quick Search** — Find any item in your kitchen instantly

## 🚀 Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/kitchen-brain.git
cd kitchen-brain
```

### 2. Install dependencies
```bash
npm install
```

### 3. Add your free API key
```bash
cp .env.example .env
# Edit .env and add your Gemini API key from https://aistudio.google.com
```

### 4. Start the app
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## 🌐 Deploy on GitHub Pages (Free)

### 1. Build the project
```bash
npm run build
```

### 2. Deploy
```bash
npm install -g gh-pages
gh-pages -d dist
```

Your app will be live at: `https://YOUR_USERNAME.github.io/kitchen-brain`

## 🛠️ Tech Stack

| Tool | Purpose | Cost |
|------|---------|------|
| React + Vite | Frontend | Free |
| Google Gemini API | AI image reading | Free tier |
| GitHub Pages | Hosting | Free |

## 📱 How It Works

1. User takes a photo of a food item
2. Gemini AI reads the image → extracts name, quantity, expiry date
3. Item is saved and categorized automatically
4. App sends alerts 2 days before expiry
5. User can search, view, and manage their entire kitchen

## 🤝 Contributing

Pull requests are welcome! This is an early prototype — lots of room to grow.

## 📄 License

MIT License — free to use and modify.
