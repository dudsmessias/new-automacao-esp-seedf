import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { Selo } from "@shared/schema";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { requireRole, Permissions } from "../middleware/rbac";
import { validateBody, validateParams } from "../middleware/validate";
import { logger } from "../utils/logger";

const router = Router();

const createEspSchema = z.object({
  codigo: z.string().min(3),
  titulo: z.string().min(3),
  tipologia: z.string().min(1),
  revisao: z.string(),
  dataPublicacao: z.string().transform((val) => new Date(val)),
  selo: z.nativeEnum(Selo).optional(),
  cadernoId: z.string(),
  visivel: z.boolean().optional(),
  descricaoAplicacao: z.string().optional(),
  execucao: z.string().optional(),
  fichasReferencia: z.string().optional(),
  recebimento: z.string().optional(),
  servicosIncluidos: z.string().optional(),
  criteriosMedicao: z.string().optional(),
  legislacao: z.string().optional(),
  referencias: z.string().optional(),
});

const updateEspSchema = createEspSchema.partial();

const paramsSchema = z.object({
  id: z.string(),
});

// GET /api/esp
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { cadernoId, visivel, search, date, author, status } = req.query;
    
    const esps = await storage.getEsps({
      cadernoId: cadernoId as string | undefined,
      visivel: visivel === "true" ? true : visivel === "false" ? false : undefined,
    });

    // Get authors and cadernos for each ESP
    let espsWithRelations = await Promise.all(
      esps.map(async (esp) => {
        const [autor, caderno, arquivos] = await Promise.all([
          storage.getUserWithoutPassword(esp.autorId),
          storage.getCaderno(esp.cadernoId),
          storage.getArquivosMidiaByEsp(esp.id),
        ]);
        return { ...esp, autor, caderno, arquivos };
      })
    );

    // Apply search filter
    if (search && typeof search === "string") {
      const searchLower = search.toLowerCase();
      espsWithRelations = espsWithRelations.filter((esp) => {
        return (
          esp.codigo.toLowerCase().includes(searchLower) ||
          esp.titulo.toLowerCase().includes(searchLower) ||
          esp.tipologia.toLowerCase().includes(searchLower) ||
          esp.autor?.nome.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply date filter
    if (date && typeof date === "string") {
      const filterDate = new Date(date);
      espsWithRelations = espsWithRelations.filter((esp) => {
        const espDate = new Date(esp.dataPublicacao);
        return (
          espDate.getFullYear() === filterDate.getFullYear() &&
          espDate.getMonth() === filterDate.getMonth() &&
          espDate.getDate() === filterDate.getDate()
        );
      });
    }

    // Apply author filter
    if (author && typeof author === "string") {
      const authorLower = author.toLowerCase();
      espsWithRelations = espsWithRelations.filter((esp) => {
        return esp.autor?.nome.toLowerCase().includes(authorLower);
      });
    }

    // Apply status filter (based on caderno status)
    if (status && typeof status === "string") {
      espsWithRelations = espsWithRelations.filter((esp) => {
        return esp.caderno?.status === status;
      });
    }

    res.json({ esps: espsWithRelations });
  } catch (error) {
    logger.error("Error fetching ESPs", { error });
    res.status(500).json({ error: "Erro ao buscar ESPs" });
  }
});

// GET /api/esp/:id
router.get("/:id", authenticateToken, validateParams(paramsSchema), async (req: AuthRequest, res) => {
  try {
    const esp = await storage.getEsp(req.params.id);
    if (!esp) {
      return res.status(404).json({ error: "ESP não encontrada" });
    }

    const [autor, caderno, arquivos] = await Promise.all([
      storage.getUserWithoutPassword(esp.autorId),
      storage.getCaderno(esp.cadernoId),
      storage.getArquivosMidiaByEsp(esp.id),
    ]);

    res.json({ esp: { ...esp, autor, caderno, arquivos } });
  } catch (error) {
    logger.error("Error fetching ESP", { error });
    res.status(500).json({ error: "Erro ao buscar ESP" });
  }
});

// POST /api/esp
router.post(
  "/",
  authenticateToken,
  requireRole(...Permissions.createEsp),
  validateBody(createEspSchema),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      // Check if caderno exists
      const caderno = await storage.getCaderno(req.body.cadernoId);
      if (!caderno) {
        return res.status(404).json({ error: "Caderno não encontrado" });
      }

      const esp = await storage.createEsp({
        ...req.body,
        autorId: req.user.id,
      });

      await storage.createLog({
        userId: req.user.id,
        acao: "CRIAR_ESP",
        alvo: esp.id,
        detalhes: `ESP "${esp.codigo}" criada`,
      });

      logger.info("ESP created", { espId: esp.id, userId: req.user.id });

      res.status(201).json({ esp });
    } catch (error) {
      logger.error("Error creating ESP", { error });
      res.status(500).json({ error: "Erro ao criar ESP" });
    }
  }
);

// PATCH /api/esp/:id
router.patch(
  "/:id",
  authenticateToken,
  requireRole(...Permissions.editEsp),
  validateParams(paramsSchema),
  validateBody(updateEspSchema),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const esp = await storage.updateEsp(req.params.id, req.body);
      if (!esp) {
        return res.status(404).json({ error: "ESP não encontrada" });
      }

      await storage.createLog({
        userId: req.user.id,
        acao: "ATUALIZAR_ESP",
        alvo: esp.id,
        detalhes: `ESP "${esp.codigo}" atualizada`,
      });

      logger.info("ESP updated", { espId: esp.id, userId: req.user.id });

      res.json({ esp });
    } catch (error) {
      logger.error("Error updating ESP", { error });
      res.status(500).json({ error: "Erro ao atualizar ESP" });
    }
  }
);

// DELETE /api/esp/:id
router.delete(
  "/:id",
  authenticateToken,
  requireRole(...Permissions.editEsp),
  validateParams(paramsSchema),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const esp = await storage.getEsp(req.params.id);
      if (!esp) {
        return res.status(404).json({ error: "ESP não encontrada" });
      }

      const deleted = await storage.deleteEsp(req.params.id);
      if (!deleted) {
        return res.status(500).json({ error: "Erro ao deletar ESP" });
      }

      await storage.createLog({
        userId: req.user.id,
        acao: "DELETAR_ESP",
        alvo: req.params.id,
        detalhes: `ESP "${esp.codigo}" deletada`,
      });

      logger.info("ESP deleted", { espId: req.params.id, userId: req.user.id });

      res.json({ message: "ESP deletada com sucesso" });
    } catch (error) {
      logger.error("Error deleting ESP", { error });
      res.status(500).json({ error: "Erro ao deletar ESP" });
    }
  }
);

// POST /api/esp/nova - Create ESP with multiple cadernos
const novaEspSchema = z.object({
  cadernosIds: z.array(z.string()).min(1, "Selecione pelo menos um caderno"),
});

router.post(
  "/nova",
  authenticateToken,
  requireRole(...Permissions.createEsp),
  validateBody(novaEspSchema),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const { cadernosIds } = req.body;

      // Validate all cadernos exist
      const cadernos = await Promise.all(
        cadernosIds.map((id: string) => storage.getCaderno(id))
      );
      
      const missingCadernos = cadernos.filter(c => !c);
      if (missingCadernos.length > 0) {
        return res.status(404).json({ error: "Um ou mais cadernos não encontrados" });
      }

      // Get first caderno for basic ESP info
      const primeiroCaderno = cadernos[0]!;
      
      // Generate unique codigo based on caderno title and timestamp
      const timestamp = Date.now().toString().slice(-6);
      const codigo = `ESP-${timestamp}`;

      // Create ESP with multiple cadernos
      const esp = await storage.createEsp({
        codigo,
        titulo: `ESP - ${primeiroCaderno.titulo}`,
        tipologia: "Multi-Caderno",
        revisao: "1.0",
        dataPublicacao: new Date(),
        autorId: req.user.id,
        selo: Selo.NENHUM,
        cadernoId: primeiroCaderno.id, // Keep first caderno for backward compatibility
        cadernosIds, // Array of all caderno IDs
        visivel: true,
      });

      await storage.createLog({
        userId: req.user.id,
        acao: "CRIAR_ESP_MULTI_CADERNO",
        alvo: esp.id,
        detalhes: `ESP "${esp.codigo}" criada com ${cadernosIds.length} cadernos`,
      });

      logger.info("Multi-caderno ESP created", { 
        espId: esp.id, 
        userId: req.user.id,
        cadernosCount: cadernosIds.length 
      });

      res.status(201).json({ esp });
    } catch (error) {
      logger.error("Error creating multi-caderno ESP", { error });
      res.status(500).json({ error: "Erro ao criar ESP" });
    }
  }
);

export default router;
