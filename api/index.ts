import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoute } from "./routes/auth";
import { userRoute } from "./routes/user";
import { puzzleRoute } from "./routes/puzzle";
import { bangumiRoute } from "./routes/bangumi";

export type Env = {
  MISC_DB: D1Database;
  STATIC_BUCKET: R2Bucket;
  VITE_BGM_CLIENT_ID: string;
  BGM_APP_SECRET: string;
  VITE_BGM_REDIRECT_URI: string;
}

const app = new Hono<{ Bindings: Env }>();

// Add CORS support
app.use("/api/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check endpoint
app.get("/api/health", (c) => {
  return c.json({ status: "healthy" });
});

// Mount routes under /api
app.route("/api", authRoute);
app.route("/api", userRoute);
app.route("/api", puzzleRoute);
app.route("/api", bangumiRoute);

// 404 handling
app.notFound((c) => {
  return c.json({ error: "API endpoint not found" }, 404);
});

// Error handling
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

async function handleFetch(req: Request, env: Env, ctx: ExecutionContext) {
  return app.fetch(req, env, ctx);
}

export default {
  fetch: handleFetch,
} satisfies ExportedHandler<Env>;
