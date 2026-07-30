import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { torneosRouter } from "./routes/torneos";
import { equiposRouter } from "./routes/equipos";
import { partidosRouter } from "./routes/partidos";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRouter);
app.use("/torneos", torneosRouter);
app.use("/equipos", equiposRouter);
app.use("/partidos", partidosRouter);

// Manejo centralizado de errores no controlados
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`TorneoApp API escuchando en http://localhost:${PORT}`);
});
