import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoute } from "./routes/auth";
import { userRoute } from "./routes/user";
import { puzzleRoute } from "./routes/puzzle";

export type Env = {
  MISC_DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  OAUTH_REDIRECT_URI: string;
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

// Mount routes
app.route("/", authRoute);
app.route("/", userRoute);
app.route("/", puzzleRoute);

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
