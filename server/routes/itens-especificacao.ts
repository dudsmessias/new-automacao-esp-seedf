import { Router } from "express";
import { storage } from "../storage";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { insertItemEspecificacaoSchema, CategoriaItem } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

const router = Router();

// GET /api/itens-especificacao - List all itens técnicos com filtros
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const categoria = req.query.categoria as CategoriaItem | undefined;
    const ativo = req.query.ativo === "false" ? false : true;
    
    const filters = {
      categoria,
      ativo,
    };
    
    const itens = await storage.getItensEspecificacao(filters);
    res.json({ itens });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar itens técnicos" });
  }
});

// GET /api/itens-especificacao/:id - Get item específico
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const item = await storage.getItemEspecificacao(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item não encontrado" });
    }
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar item técnico" });
  }
});

// POST /api/itens-especificacao - Create new item técnico
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const parsed = insertItemEspecificacaoSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessage = fromZodError(parsed.error).toString();
      return res.status(400).json({ error: errorMessage });
    }
    
    const item = await storage.createItemEspecificacao(parsed.data);
    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar item técnico" });
  }
});

// PATCH /api/itens-especificacao/:id - Update item técnico
router.patch("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const existing = await storage.getItemEspecificacao(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Item não encontrado" });
    }
    
    const item = await storage.updateItemEspecificacao(req.params.id, req.body);
    res.json({ item });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar item técnico" });
  }
});

// DELETE /api/itens-especificacao/:id - Delete (soft delete) item técnico
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const existing = await storage.getItemEspecificacao(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Item não encontrado" });
    }
    
    await storage.deleteItemEspecificacao(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir item técnico" });
  }
});

export default router;
