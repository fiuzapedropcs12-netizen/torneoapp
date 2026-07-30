import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Exige un JWT válido en el header Authorization: Bearer <token> */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no provisto" });
  }

  try {
    const token = header.slice("Bearer ".length);
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

/** Exige rol ORGANIZADOR. Usar siempre después de requireAuth. */
export function requireOrganizador(req: Request, res: Response, next: NextFunction) {
  if (req.user?.rol !== "ORGANIZADOR") {
    return res.status(403).json({ error: "Acción reservada al rol organizador" });
  }
  next();
}
