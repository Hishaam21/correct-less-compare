# Less Compare — AI-Powered Price Comparison

A smart South African price comparison website using OpenAI for natural language search.

## Features
- **AI Search Engine**: Use natural language to find products (e.g., "smoothie blender" or "cheap rice")
- **Price Comparison**: See cheapest prices across retailers
- **Smart Budget Planner**: List monthly items; AI recommends cheapest store combinations and calculates total cost
- **Retailers**: Shoprite, Pick n Pay, Game, Makro, Clicks, Dis-Chem, Takealot, HiFi Corp, Midas, AutoZone, Woolworths
- **Categories**: Groceries, Home Appliances, Beauty, Sports & Fitness, Auto Parts

## Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: Express.js
- **AI**: OpenAI API (GPT-4o-mini)
- **Colors**: Trust Blue (#0b5ed7), Savings Green (#2f9e44), Deal Orange (#ff7a00)

## Quick Start

### 1. Get OpenAI API Key
Sign up at [openai.com](https://openai.com) and create an API key.

### 2. Install & Setup
```powershell
cd 'c:\Users\LENOVO\Downloads\less compare'
npm install
```

### 3. Create `.env` file
Copy `.env.example` to `.env` and add your OpenAI key:
```
OPENAI_API_KEY=sk-...your-key-here...
PORT=3001
```

### 4. Run Both Frontend & Backend
```powershell
npm run dev:both
```

Or run separately:
```powershell
# Terminal 1: Backend server
npm run dev:server

# Terminal 2: Frontend (Vite)
npm run dev -- --host
```

Open **http://localhost:5173** in your browser.

## How It Works

### Search
- Type natural queries like "good blender", "budget rice", "quality shampoo"
- AI understands intent and matches relevant products
- Filter by category if needed

### Budget Planner
- Enter items you need (e.g., "Rice", "Milk", "Chicken")
- AI finds the cheapest matching products from our dataset
- Shows total estimated monthly cost
- Recommends which stores to shop at

## Notes
- Uses mock product data (`src/data/products.json`)
- **Requires OpenAI API key** to enable AI features
- Falls back to basic text matching if server is unavailable
- Frontend works without server (basic search only)
