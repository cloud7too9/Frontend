import express from "express";
import cors from "cors";
import { workspacesRouter } from "./routes/workspaces.js";
import { toolsRouter } from "./routes/tools.js";

const PORT = Number(process.env.PORT ?? 3001);
const ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(cors({ origin: ORIGIN }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/workspaces", workspacesRouter);
app.use("/api/tools", toolsRouter);

app.listen(PORT, () => {
  console.log(`[mainhub-server] listening on http://localhost:${PORT}`);
});
