import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chatRoutes.js";

import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use(
  cors({
    origin: [process.env.FRONTEND_ORIGIN, "http://localhost:3000"],
    credentials: true,
  })
);

// Routes
app.use("/api", chatRouter);
app.use("/api/agents", aiRoutes);

app.listen(PORT, () => {
  console.log(`\n RAG API Server running on port ${PORT}`);
});
