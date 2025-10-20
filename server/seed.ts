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

    // Create catalog data for Descrição e Aplicação
    // Constituintes
    const constituentesData = [
      { nome: "Argamassa de cimento e areia" },
      { nome: "Blocos cerâmicos" },
      { nome: "Blocos de concreto" },
      { nome: "Concreto estrutural" },
      { nome: "Aço CA-50" },
      { nome: "Aço CA-60" },
      { nome: "Tinta látex acrílica" },
      { nome: "Tinta epóxi" },
    ];

    for (const data of constituentesData) {
      const existing = await storage.getConstituenteByNome(data.nome);
      if (!existing) {
        await storage.createConstituinte(data);
        logger.info(`Constituinte created: ${data.nome}`);
      } else {
        logger.info(`Constituinte already exists: ${data.nome}`);
      }
    }

    // Acessórios
    const acessoriosData = [
      { nome: "Parafusos 3/8\"" },
      { nome: "Pregos 18x27" },
      { nome: "Buchas S8" },
      { nome: "Dobradiças 3\" cromadas" },
      { nome: "Fechadura com chave" },
      { nome: "Puxadores em alumínio" },
    ];

    for (const data of acessoriosData) {
      const existing = await storage.getAcessorioByNome(data.nome);
      if (!existing) {
        await storage.createAcessorio(data);
        logger.info(`Acessório created: ${data.nome}`);
      } else {
        logger.info(`Acessório already exists: ${data.nome}`);
      }
    }

    // Acabamentos
    const acabamentosData = [
      { nome: "Pintura lisa" },
      { nome: "Pintura texturizada" },
      { nome: "Revestimento cerâmico" },
      { nome: "Porcelanato" },
      { nome: "Gesso liso" },
      { nome: "Forro de PVC" },
    ];

    for (const data of acabamentosData) {
      const existing = await storage.getAcabamentoByNome(data.nome);
      if (!existing) {
        await storage.createAcabamento(data);
        logger.info(`Acabamento created: ${data.nome}`);
      } else {
        logger.info(`Acabamento already exists: ${data.nome}`);
      }
    }

    // Protótipos Comerciais
    const prototiposData = [
      { item: "Cano PVC 20mm", marca: "Tigre" },
      { item: "Cano PVC 20mm", marca: "Gravia" },
      { item: "Cano PVC 25mm", marca: "Tigre" },
      { item: "Barra de ferro 20x30mm", marca: "Gerdau" },
      { item: "Barra de ferro 20x30mm", marca: "Belgo" },
      { item: "Tinta látex 18L", marca: "Suvinil" },
      { item: "Tinta látex 18L", marca: "Coral" },
      { item: "Cimento 50kg", marca: "Votorantim" },
    ];

    for (const data of prototiposData) {
      const existing = await storage.getPrototipoComercialByItemMarca(data.item, data.marca);
      if (!existing) {
        await storage.createPrototipoComercial(data);
        logger.info(`Protótipo comercial created: ${data.item} - ${data.marca}`);
      } else {
        logger.info(`Protótipo comercial already exists: ${data.item} - ${data.marca}`);
      }
    }

    // Aplicações
    const aplicacoesData = [
      { nome: "Infraestrutura" },
      { nome: "Acabamento" },
      { nome: "Elétrica" },
      { nome: "Hidráulica" },
      { nome: "Estrutural" },
      { nome: "Revestimento" },
    ];

    for (const data of aplicacoesData) {
      const existing = await storage.getAplicacaoByNome(data.nome);
      if (!existing) {
        await storage.createAplicacao(data);
        logger.info(`Aplicação created: ${data.nome}`);
      } else {
        logger.info(`Aplicação already exists: ${data.nome}`);
      }
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
