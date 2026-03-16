# LightMatch — CodeSandbox Setup

LED panel cross-reference and quoting tool with AI-powered spec sheet extraction.

## Running in CodeSandbox

### Step 1 — Add your Anthropic API key
1. In the left sidebar click **Settings** (gear icon)
2. Go to **Environment Variables**
3. Add: `ANTHROPIC_API_KEY` = `sk-ant-your-key-here`
4. Save and the sandbox will restart

Get a key at: https://console.anthropic.com/

### Step 2 — Build & start (automatic on first open)
CodeSandbox will automatically run the setup tasks. If it does not:

Open the **Terminal** tab and run:
```
npm install
cd client && npm install && npm run build
cd ..
npm start
```

### Step 3 — Use the app
The app opens in the browser preview pane at port 3000.

## Project Structure
```
lightmatch/
  server.js              Express proxy server (port 3000)
  package.json           Server dependencies
  sandbox.config.json    CodeSandbox configuration
  .codesandbox/
    tasks.json           Auto-setup tasks
  client/
    src/
      App.tsx            Main app + sidebar
      components/
        Dashboard.tsx    Home screen
        MatchEngine.tsx  Match & Convert tool
        KnowledgeBase.tsx  Product database + spec sheet wizard
        QuoteBuilder.tsx   Quote builder + export
      lib/
        database.ts      In-memory product database
      index.css          All styles
    vite.config.ts       Vite + proxy config
    package.json         React dependencies
```

## Features
- Match competitor LED panels to Cooper Lighting equivalents
- Upload PDF spec sheets — Claude extracts all fields automatically
- After indexing, auto-searches for top 5 competitor spec sheets with download links
- Build and export quotes as CSV or print-ready PDF
- Knowledge base grows with every spec sheet you add
