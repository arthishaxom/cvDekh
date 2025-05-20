import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import resumeRouter from "./routes/resume";
import dotenv from "dotenv/config";

const app = express();
const port = 80;

app.all("/api/auth/*splat", toNodeHandler(auth));

// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.use(express.json());

app.use("/api/resume", resumeRouter);

app.listen(port, () => {
  console.log(`Better Auth app listening on port ${port}`);
});
