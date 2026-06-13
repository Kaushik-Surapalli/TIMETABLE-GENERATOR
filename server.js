// Minimal Express server that serves the production build (dist/).
// Usage:
//   npm run build   → creates dist/
//   npm start        → runs this server (defaults to PORT 3000)

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const distPath = path.join(__dirname, "dist");

app.use(express.static(distPath));

// SPA fallback: send index.html for any non-file route (client-side routing safe)
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Timetable Generator running at http://localhost:${PORT}`);
});
