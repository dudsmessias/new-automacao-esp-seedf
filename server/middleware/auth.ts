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
  console.log("🔍 Auth Debug - All cookies:", req.cookies);
  console.log("🔍 Auth Debug - Headers:", req.headers.cookie);
  
  const token = req.cookies?.esp_session;

  if (!token) {
    console.log("❌ No token found in cookies");
    return res.status(401).json({ error: "Não autenticado" });
  }

  const user = verifyToken(token);
  if (!user) {
    console.log("❌ Invalid token");
    return res.status(401).json({ error: "Token inválido" });
  }

  console.log("✅ User authenticated:", user.email);
  req.user = user;
  next();
}
