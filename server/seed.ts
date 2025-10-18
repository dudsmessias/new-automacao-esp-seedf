import bcrypt from "bcrypt";
import { storage } from "./storage";
import { Perfil, StatusCaderno, Selo } from "@shared/schema";
import { logger } from "./utils/logger";

export async function seedDatabase() {
  try {
    logger.info("Starting database seed...");

    // Create 4 test users (one for each role)
    const users = [
      {
        nome: "João Arquiteto",
        email: "arquiteto@seedf.df.gov.br",
        senha: "Arquiteto123!",
        perfil: Perfil.ARQUITETO,
      },
      {
        nome: "Maria Chefe",
        email: "chefe@seedf.df.gov.br",
        senha: "Chefe123!",
        perfil: Perfil.CHEFE_DE_NUCLEO,
      },
      {
        nome: "Pedro Gerente",
        email: "gerente@seedf.df.gov.br",
        senha: "Gerente123!",
        perfil: Perfil.GERENTE,
      },
      {
        nome: "Ana Diretora",
        email: "diretor@seedf.df.gov.br",
        senha: "Diretor123!",
        perfil: Perfil.DIRETOR,
      },
    ];

    const createdUsers = [];
    for (const userData of users) {
      const existingUser = await storage.getUserByEmail(userData.email);
      if (!existingUser) {
        const hashSenha = await bcrypt.hash(userData.senha, 10);
        const user = await storage.createUser({
          nome: userData.nome,
          email: userData.email,
          hashSenha,
          perfil: userData.perfil,
          ativo: true,
        });
        createdUsers.push(user);
        logger.info(`User created: ${userData.email}`);
      } else {
        createdUsers.push(existingUser);
        logger.info(`User already exists: ${userData.email}`);
      }
    }

    const arquiteto = createdUsers.find(u => u.perfil === Perfil.ARQUITETO);
    if (!arquiteto) {
      throw new Error("Arquiteto user not found");
    }

    // Create 1 Caderno (check if exists first)
    const allCadernos = await storage.getCadernos();
    let caderno = allCadernos.find(c => c.titulo === "Caderno de Especificações - Edificações 2025");
    
    if (!caderno) {
      caderno = await storage.createCaderno({
        titulo: "Caderno de Especificações - Edificações 2025",
        descricao: "Caderno principal para especificações de edificações escolares",
        status: StatusCaderno.EM_ANDAMENTO,
        autorId: arquiteto.id,
      });
      logger.info(`Caderno created: ${caderno.id}`);
    } else {
      logger.info(`Caderno already exists: ${caderno.id}`);
    }

    // Create 2 ESPs (check if exists first)
    const allEsps = await storage.getEsps({ cadernoId: caderno.id });
    
    let esp1 = allEsps.find(e => e.codigo === "ESP-001");
    if (!esp1) {
      esp1 = await storage.createEsp({
        codigo: "ESP-001",
        titulo: "Especificação de Pintura Interna",
        tipologia: "Acabamento",
        revisao: "v1.0",
        dataPublicacao: new Date("2025-01-15"),
        autorId: arquiteto.id,
        selo: Selo.AMBIENTAL,
        cadernoId: caderno.id,
        visivel: true,
        descricaoAplicacao: "Pintura interna para ambientes escolares, utilizando tintas de baixo VOC.",
        execucao: "1. Preparação da superfície\n2. Aplicação de fundo\n3. Duas demãos de tinta látex",
        fichasReferencia: "NBR 15079:2011 - Tintas para edificações",
        criteriosMedicao: "Medição por m² de área pintada",
      });
      logger.info(`ESP created: ${esp1.codigo}`);
    } else {
      logger.info(`ESP already exists: ${esp1.codigo}`);
    }

    let esp2 = allEsps.find(e => e.codigo === "ESP-002");
    if (!esp2) {
      esp2 = await storage.createEsp({
        codigo: "ESP-002",
        titulo: "Especificação de Alvenaria de Vedação",
        tipologia: "Estrutura",
        revisao: "v1.0",
        dataPublicacao: new Date("2025-01-20"),
        autorId: arquiteto.id,
        selo: Selo.NENHUM,
        cadernoId: caderno.id,
        visivel: true,
        descricaoAplicacao: "Alvenaria de vedação em blocos cerâmicos para divisão de ambientes.",
        execucao: "1. Marcação da alvenaria\n2. Assentamento dos blocos\n3. Fixação nas estruturas",
        legislacao: "Lei Distrital nº 5.920/2017 - Código de Edificações do DF",
      });
      logger.info(`ESP created: ${esp2.codigo}`);
    } else {
      logger.info(`ESP already exists: ${esp2.codigo}`);
    }

    // Create activity logs
    await storage.createLog({
      userId: arquiteto.id,
      acao: "SEED_DATABASE",
      alvo: "SYSTEM",
      detalhes: "Banco de dados populado com dados iniciais",
    });

    logger.info("Database seed completed successfully!");
    logger.info("=".repeat(60));
    logger.info("Test Credentials:");
    logger.info("=".repeat(60));
    users.forEach(u => {
      logger.info(`${u.perfil}: ${u.email} / ${u.senha}`);
    });
    logger.info("=".repeat(60));

  } catch (error) {
    logger.error("Error seeding database", { error });
    throw error;
  }
}
