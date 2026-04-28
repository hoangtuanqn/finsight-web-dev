import express from "express";
import cors from "cors";
import type { ApiResponse, User } from "@repo/types";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_, res) => {
  const response: ApiResponse<{ status: string }> = {
    success: true,
    data: { status: "ok" },
  };
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
