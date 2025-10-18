import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserWithoutPassword } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret_seedf_esp_2025";

export interface AuthRequest extends Request {
  user?: UserWithoutPassword;
}

export function generateToken(user: UserWithoutPassword): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      perfil: user.perfil,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): UserWithoutPassword | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserWithoutPassword;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Check Authorization header first (preferred method)
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }
  
  // Fallback to cookie if no Authorization header
  if (!token) {
    token = req.cookies?.esp_session;
  }

  if (!token) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Token inválido" });
  }

  req.user = user;
  next();
}
