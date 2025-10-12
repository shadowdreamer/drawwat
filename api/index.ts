import { Hono } from "hono";
import { cors } from "hono/cors";

export type Env = { 
  MISC_DB: D1Database;
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

// Example API endpoint
app.get("/api/example", async (c) => {
  try {
    const result = await c.env.MISC_DB.prepare("SELECT * FROM example_table").all();
    return c.json({ success: true, data: result.results });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

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

