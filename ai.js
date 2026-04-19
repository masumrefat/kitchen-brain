// =====================
// Kitchen Brain - AI
// =====================

async function analyzeImageWithGemini(base64Image, apiKey) {
  const prompt = `You are a kitchen inventory AI. Analyze this food product image and extract information.

Return ONLY a valid JSON object with exactly these fields:
{
  "name": "Product name (e.g. Greek Yogurt, Whole Milk, Cheddar Cheese)",
  "quantity": "Amount with unit (e.g. 500g, 1L, 250g, 1 loaf)",
  "category": "One of: Dairy, Vegetables, Fruits, Meat, Bakery, Beverages, Frozen, Condiments, Snacks, Other",
  "expiryDate": "YYYY-MM-DD format. If visible on package use that date. If not visible, estimate based on typical shelf life from today ${new Date().toISOString().split('T')[0]}",
  "confidence": "high or medium or low"
}

Be specific with the product name. Look for any expiry/best before dates on the packaging.
Return ONLY the JSON, no other text.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Gemini API error");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Clean and parse JSON
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  // Validate category
  const validCats = Object.keys(CATEGORIES);
  if (!validCats.includes(parsed.category)) parsed.category = "Other";

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.expiryDate)) {
    parsed.expiryDate = daysFromNow(7); // fallback
  }

  return parsed;
}

// Fallback demo mode (no API key)
async function analyzeImageDemo() {
  await new Promise(r => setTimeout(r, 2200)); // simulate delay

  const demos = [
    { name: "Greek Yogurt",    quantity: "500g",   category: "Dairy",      expiryDate: daysFromNow(2),  confidence: "high" },
    { name: "Cheddar Cheese",  quantity: "250g",   category: "Dairy",      expiryDate: daysFromNow(5),  confidence: "high" },
    { name: "Fresh Spinach",   quantity: "200g",   category: "Vegetables", expiryDate: daysFromNow(3),  confidence: "high" },
    { name: "Orange Juice",    quantity: "1L",     category: "Beverages",  expiryDate: daysFromNow(7),  confidence: "high" },
    { name: "Sourdough Bread", quantity: "1 loaf", category: "Bakery",     expiryDate: daysFromNow(4),  confidence: "medium" },
    { name: "Chicken Breast",  quantity: "600g",   category: "Meat",       expiryDate: daysFromNow(1),  confidence: "high" },
    { name: "Whole Milk",      quantity: "1L",     category: "Dairy",      expiryDate: daysFromNow(9),  confidence: "high" },
    { name: "Strawberries",    quantity: "300g",   category: "Fruits",     expiryDate: daysFromNow(2),  confidence: "medium" },
  ];
  return demos[Math.floor(Math.random() * demos.length)];
}

async function extractItemFromImage(base64Image) {
  const apiKey = state.apiKey;
  if (apiKey && apiKey.length > 10) {
    return await analyzeImageWithGemini(base64Image, apiKey);
  } else {
    return await analyzeImageDemo();
  }
}
