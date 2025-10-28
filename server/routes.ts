import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth";
import cadernosRoutes from "./routes/cadernos";
import espRoutes from "./routes/esp";
import exportRoutes from "./routes/export";
import logsRoutes from "./routes/logs";
import filesRoutes from "./routes/files";
import catalogRoutes from "./routes/catalog";
import itensEspecificacaoRoutes from "./routes/itens-especificacao";
import { logger } from "./utils/logger";
import { seedDatabase } from "./seed";

export async function registerRoutes(app: Express): Promise<Server> {
  // IMPORTANT: cookie-parser must be registered in index.ts BEFORE this function
  // Middleware
  app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
  }));

  // Seed database on startup
  try {
    await seedDatabase();
  } catch (error) {
    logger.error("Failed to seed database", { error });
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "SEEDF ESP System",
    });
  });

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/cadernos", cadernosRoutes);
  app.use("/api/esp", espRoutes);
  app.use("/api/files", filesRoutes);
  app.use("/api/export", exportRoutes);
  app.use("/api/logs", logsRoutes);
  app.use("/api/catalog", catalogRoutes);
  app.use("/api/itens-especificacao", itensEspecificacaoRoutes);

  // API documentation placeholder
  app.get("/api/docs", (req, res) => {
    res.json({
      message: "SEEDF ESP API Documentation",
      version: "1.0.0",
      endpoints: {
        auth: {
          "POST /api/auth/register": "Register new user",
          "POST /api/auth/login": "Login user",
          "POST /api/auth/logout": "Logout user",
          "GET /api/auth/me": "Get current user",
        },
        cadernos: {
          "GET /api/cadernos": "List all cadernos",
          "GET /api/cadernos/:id": "Get caderno by ID",
          "POST /api/cadernos": "Create new caderno",
          "PATCH /api/cadernos/:id": "Update caderno",
          "DELETE /api/cadernos/:id": "Delete caderno",
        },
        esp: {
          "GET /api/esp": "List all ESPs",
          "GET /api/esp/:id": "Get ESP by ID",
          "POST /api/esp": "Create new ESP",
          "PATCH /api/esp/:id": "Update ESP",
          "DELETE /api/esp/:id": "Delete ESP",
        },
        export: {
          "POST /api/export/pdf/:espId": "Export ESP as PDF",
          "POST /api/export/docx/:espId": "Export ESP as DOCX",
        },
        logs: {
          "GET /api/logs": "Get activity logs",
        },
        health: {
          "GET /api/health": "Health check",
        },
      },
      rbac: {
        ARQUITETO: ["Create/Edit ESP", "Create/Edit Caderno", "Upload files"],
        CHEFE_DE_NUCLEO: ["Create/Edit Caderno", "View logs", "Validate ESP"],
        GERENTE: ["Delete Caderno", "View logs", "Export PDF"],
        DIRETOR: ["All permissions", "Export DOCX", "Approve ESP"],
      },
    });
  });

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    logger.error("Unhandled error", { error: err, path: req.path });
    res.status(500).json({
      error: "Erro interno do servidor",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
