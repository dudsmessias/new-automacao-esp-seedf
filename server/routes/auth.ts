import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "../storage";
import { Perfil } from "@shared/schema";
import { generateToken, authenticateToken, AuthRequest } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { logger } from "../utils/logger";

const router = Router();

const registerSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email().regex(/@.*\.gov\.br$/, "E-mail institucional obrigatório"),
  senha: z.string().min(6),
  perfil: z.nativeEnum(Perfil),
});

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string(),
});

// POST /api/auth/register
router.post("/register", validateBody(registerSchema), async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;

    // Check if user exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    // Hash password
    const hashSenha = await bcrypt.hash(senha, 10);

    // Create user
    const user = await storage.createUser({
      nome,
      email,
      hashSenha,
      perfil,
      ativo: true,
    });

    logger.info("User registered", { userId: user.id, email: user.email });

    const { hashSenha: _, ...userWithoutPassword } = user;
    res.status(201).json({
      message: "Usuário criado com sucesso",
      user: userWithoutPassword,
    });
  } catch (error) {
    logger.error("Registration error", { error });
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// POST /api/auth/login
router.post("/login", validateBody(loginSchema), async (req, res) => {
  try {
    const { email, senha } = req.body;

    const user = await storage.getUserByEmail(email);
    if (!user || !user.ativo) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isValidPassword = await bcrypt.compare(senha, user.hashSenha);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const { hashSenha: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    console.log("🍪 Setting cookie esp_session with token (length):", token.length);
    
    res.cookie("esp_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    console.log("✅ Cookie set successfully");
    logger.info("User logged in", { userId: user.id, email: user.email });

    res.json({
      message: "Login realizado com sucesso",
      user: userWithoutPassword,
    });
  } catch (error) {
    logger.error("Login error", { error });
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

// POST /api/auth/logout
router.post("/logout", authenticateToken, async (req: AuthRequest, res) => {
  res.clearCookie("esp_session");
  logger.info("User logged out", { userId: req.user?.id });
  res.json({ message: "Logout realizado com sucesso" });
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const userWithoutPassword = await storage.getUserWithoutPassword(req.user.id);
  if (!userWithoutPassword) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  res.json({ user: userWithoutPassword });
});

export default router;
