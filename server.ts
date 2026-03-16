import "dotenv/config";
import { createServer as createViteServer } from "vite";
import { app, setupApp } from "./api/app.js";

async function start() {
  // Create Vite server in middleware mode and configure it
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  // Pass vite to app setup
  await setupApp(vite);

  const PORT: number = Number(process.env.PORT) || 3005;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dev server running on http://localhost:${PORT}`);
  });
}

start();
