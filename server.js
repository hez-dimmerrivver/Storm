import express from "express"; // build server
import fs from "node:fs"; // read file system(JSON)
import path from "node:path"; // build file path
import { fileURLToPath } from "node:url"; // turn url into label

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve all static files (index.html, sketch.js, data/gifs/...)
app.use(express.static(path.join(__dirname, "public")));
// Build API
app.get("/api/data", (req, res) => {
  const filePath = path.join(__dirname, "data", "hurricane2025.json");
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "data/hurricane2025.json not found" });
  }
  try {
    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.json(json);
  } catch (e) {
    res.status(500).json({ error: "Failed to parse JSON: " + e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Open http://localhost:${PORT}`);
});
