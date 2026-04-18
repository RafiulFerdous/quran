import "dotenv/config";
import cors from "cors";
import express from "express";
import { disconnectDb } from "./src/db/client.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { appRouter, quranRouter } from "./src/routes/index.js";

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(cors());
app.use(express.json());

app.use(appRouter);
app.use("/api", quranRouter);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

async function shutdown() {
  await disconnectDb();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
