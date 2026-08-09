import { start } from "./server.js";

const PORT = Number(process.env.PORT ?? 4010);
const options = process.env.STATIC_DIR ? { staticDir: process.env.STATIC_DIR } : {};

start(PORT, (port) => {
  console.log(`Calendar backend running on http://localhost:${port}`);
}, options);