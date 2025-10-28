import { Router } from "express";
import { storage } from "../storage";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { SubcategoriaItem, CategoriaItem } from "@shared/schema";

const router = Router();

// GET /api/catalog/constituintes - List all constituintes from itens_especificacao
router.get("/constituintes", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const itens = await storage.getItensEspecificacao({ ativo: true });
    const constituintes = itens
      .filter(item => item.subcategoria === SubcategoriaItem.CONSTITUINTES)
      .map(item => ({
        id: item.id,
        nome: item.titulo,
        descricao: item.descricao,
      }));
    res.json({ constituintes });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar constituintes" });
  }
});

// GET /api/catalog/acessorios - List all acessórios from itens_especificacao
router.get("/acessorios", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const itens = await storage.getItensEspecificacao({ ativo: true });
    const acessorios = itens
      .filter(item => item.subcategoria === SubcategoriaItem.ACESSORIOS)
      .map(item => ({
        id: item.id,
        nome: item.titulo,
        descricao: item.descricao,
      }));
    res.json({ acessorios });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar acessórios" });
  }
});

// GET /api/catalog/acabamentos - List all acabamentos from itens_especificacao
router.get("/acabamentos", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const itens = await storage.getItensEspecificacao({ ativo: true });
    const acabamentos = itens
      .filter(item => item.subcategoria === SubcategoriaItem.ACABAMENTOS)
      .map(item => ({
        id: item.id,
        nome: item.titulo,
        descricao: item.descricao,
      }));
    res.json({ acabamentos });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar acabamentos" });
  }
});

// GET /api/catalog/prototipos - List all protótipos comerciais from itens_especificacao
router.get("/prototipos", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const itens = await storage.getItensEspecificacao({ ativo: true });
    const prototipos = itens
      .filter(item => item.subcategoria === SubcategoriaItem.PROTOTIPO_COMERCIAL)
      .map(item => ({
        id: item.id,
        nome: item.titulo,
        descricao: item.descricao,
      }));
    res.json({ prototipos });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar protótipos comerciais" });
  }
});

// GET /api/catalog/aplicacoes - List all aplicações from itens_especificacao (categoria APLICACAO)
router.get("/aplicacoes", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const itens = await storage.getItensEspecificacao({ 
      categoria: CategoriaItem.APLICACAO,
      ativo: true 
    });
    const aplicacoes = itens.map(item => ({
      id: item.id,
      nome: item.titulo,
      descricao: item.descricao,
    }));
    res.json({ aplicacoes });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar aplicações" });
  }
});

// GET /api/catalog/fichas-recebimento - List all fichas de recebimento from itens_especificacao
router.get("/fichas-recebimento", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const itens = await storage.getItensEspecificacao({ 
      categoria: CategoriaItem.RECEBIMENTO,
      ativo: true 
    });
    const fichasRecebimento = itens.map(item => ({
      id: item.id,
      nome: item.titulo,
      descricao: item.descricao,
    }));
    res.json({ fichasRecebimento });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar fichas de recebimento" });
  }
});

// GET /api/catalog/servicos-incluidos - List all servicos incluidos from itens_especificacao
router.get("/servicos-incluidos", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const itens = await storage.getItensEspecificacao({ 
      categoria: CategoriaItem.SERVICOS_INCLUIDOS,
      ativo: true 
    });
    const servicosIncluidos = itens.map(item => ({
      id: item.id,
      nome: item.titulo,
      descricao: item.descricao,
    }));
    res.json({ servicosIncluidos });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar serviços incluídos" });
  }
});

export default router;
