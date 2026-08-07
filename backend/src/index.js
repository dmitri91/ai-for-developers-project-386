import { start } from "./server.js";

const PORT = Number(process.env.PORT ?? 4010);

start(PORT, (port) => {
  console.log(`Calendar backend running on http://localhost:${port}`);
});