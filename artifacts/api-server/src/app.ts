import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import { existsSync } from "fs";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the built frontend and handle SPA routing.
// process.cwd() is /app in the Docker container (matches WORKDIR).
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.join(process.cwd(), "artifacts/kingston-energy/dist");
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // Express 5 requires named wildcards — use regex for SPA fallback
    app.get(/(.*)/, (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }
}

export default app;
