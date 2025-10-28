import {
  type User,
  type InsertUser,
  type Caderno,
  type InsertCaderno,
  type Esp,
  type InsertEsp,
  type LogAtividade,
  type InsertLogAtividade,
  type ArquivoMidia,
  type InsertArquivoMidia,
  type UserWithoutPassword,
  type Constituinte,
  type InsertConstituinte,
  type Acessorio,
  type InsertAcessorio,
  type Acabamento,
  type InsertAcabamento,
  type PrototipoComercial,
  type InsertPrototipoComercial,
  type Aplicacao,
  type InsertAplicacao,
  type FichaRecebimento,
  type InsertFichaRecebimento,
  type ServicoIncluido,
  type InsertServicoIncluido,
  type ItemEspecificacao,
  type InsertItemEspecificacao,
  Perfil,
  StatusCaderno,
  Selo,
  TipoArquivo,
  CategoriaItem,
  users,
  cadernos,
  esps,
  arquivosMidia,
  logsAtividade,
  constituintes,
  acessorios,
  acabamentos,
  prototiposComerciais,
  aplicacoes,
  fichasRecebimento,
  servicosIncluidos,
  itensEspecificacao,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserWithoutPassword(id: string): Promise<UserWithoutPassword | undefined>;
  
  // Caderno methods
  getCaderno(id: string): Promise<Caderno | undefined>;
  getCadernos(filters?: { status?: StatusCaderno; autorId?: string }): Promise<Caderno[]>;
  createCaderno(caderno: InsertCaderno): Promise<Caderno>;
  updateCaderno(id: string, updates: Partial<InsertCaderno>): Promise<Caderno | undefined>;
  deleteCaderno(id: string): Promise<boolean>;
  
  // ESP methods
  getEsp(id: string): Promise<Esp | undefined>;
  getEsps(filters?: { cadernoId?: string; visivel?: boolean }): Promise<Esp[]>;
  createEsp(esp: InsertEsp): Promise<Esp>;
  updateEsp(id: string, updates: Partial<InsertEsp>): Promise<Esp | undefined>;
  deleteEsp(id: string): Promise<boolean>;
  
  // ArquivoMidia methods
  getArquivosMidiaByEsp(espId: string): Promise<ArquivoMidia[]>;
  getArquivoMidiaById(id: string): Promise<ArquivoMidia | undefined>;
  createArquivoMidia(arquivo: InsertArquivoMidia): Promise<ArquivoMidia>;
  deleteArquivoMidia(id: string): Promise<boolean>;
  
  // LogAtividade methods
  createLog(log: InsertLogAtividade): Promise<LogAtividade>;
  getLogs(userId?: string): Promise<LogAtividade[]>;
  
  // Catalog methods
  getConstituintes(): Promise<Constituinte[]>;
  getConstituenteByNome(nome: string): Promise<Constituinte | undefined>;
  createConstituinte(constituinte: InsertConstituinte): Promise<Constituinte>;
  
  getAcessorios(): Promise<Acessorio[]>;
  getAcessorioByNome(nome: string): Promise<Acessorio | undefined>;
  createAcessorio(acessorio: InsertAcessorio): Promise<Acessorio>;
  
  getAcabamentos(): Promise<Acabamento[]>;
  getAcabamentoByNome(nome: string): Promise<Acabamento | undefined>;
  createAcabamento(acabamento: InsertAcabamento): Promise<Acabamento>;
  
  getPrototiposComerciais(): Promise<PrototipoComercial[]>;
  getPrototipoComercialByItemMarca(item: string, marca: string): Promise<PrototipoComercial | undefined>;
  createPrototipoComercial(prototipo: InsertPrototipoComercial): Promise<PrototipoComercial>;
  
  getAplicacoes(): Promise<Aplicacao[]>;
  getAplicacaoByNome(nome: string): Promise<Aplicacao | undefined>;
  createAplicacao(aplicacao: InsertAplicacao): Promise<Aplicacao>;
  
  getFichasRecebimento(): Promise<FichaRecebimento[]>;
  getFichaRecebimentoByNome(nome: string): Promise<FichaRecebimento | undefined>;
  createFichaRecebimento(ficha: InsertFichaRecebimento): Promise<FichaRecebimento>;
  
  getServicosIncluidos(): Promise<ServicoIncluido[]>;
  getServicoIncluidoByNome(nome: string): Promise<ServicoIncluido | undefined>;
  createServicoIncluido(servico: InsertServicoIncluido): Promise<ServicoIncluido>;
  
  // Itens Especificação methods
  getItensEspecificacao(filters?: { categoria?: CategoriaItem; ativo?: boolean }): Promise<ItemEspecificacao[]>;
  getItemEspecificacao(id: string): Promise<ItemEspecificacao | undefined>;
  createItemEspecificacao(item: InsertItemEspecificacao): Promise<ItemEspecificacao>;
  updateItemEspecificacao(id: string, updates: Partial<InsertItemEspecificacao>): Promise<ItemEspecificacao | undefined>;
  deleteItemEspecificacao(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const values: User = {
      id,
      nome: insertUser.nome,
      email: insertUser.email,
      hashSenha: insertUser.hashSenha,
      perfil: insertUser.perfil as Perfil,
      ativo: insertUser.ativo ?? true,
      createdAt: now,
    };
    await db.insert(users).values(values);
    return values;
  }

  async getUserWithoutPassword(id: string): Promise<UserWithoutPassword | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const { hashSenha, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Caderno methods
  async getCaderno(id: string): Promise<Caderno | undefined> {
    const result = await db.select().from(cadernos).where(eq(cadernos.id, id)).limit(1);
    return result[0];
  }

  async getCadernos(filters?: { status?: StatusCaderno; autorId?: string }): Promise<Caderno[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(cadernos.status, filters.status));
    }
    if (filters?.autorId) {
      conditions.push(eq(cadernos.autorId, filters.autorId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(cadernos).where(and(...conditions));
    }
    return await db.select().from(cadernos);
  }

  async createCaderno(insertCaderno: InsertCaderno): Promise<Caderno> {
    const id = randomUUID();
    const now = new Date();
    const values: Caderno = {
      id,
      titulo: insertCaderno.titulo,
      descricao: insertCaderno.descricao ?? null,
      status: (insertCaderno.status ?? StatusCaderno.EM_ANDAMENTO) as StatusCaderno,
      autorId: insertCaderno.autorId,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(cadernos).values(values);
    return values;
  }

  async updateCaderno(id: string, updates: Partial<InsertCaderno>): Promise<Caderno | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (updates.titulo !== undefined) updateData.titulo = updates.titulo;
    if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.autorId !== undefined) updateData.autorId = updates.autorId;
    
    await db.update(cadernos).set(updateData).where(eq(cadernos.id, id));
    return this.getCaderno(id);
  }

  async deleteCaderno(id: string): Promise<boolean> {
    const result = await db.delete(cadernos).where(eq(cadernos.id, id)).returning({ id: cadernos.id });
    return result.length > 0;
  }

  // ESP methods
  async getEsp(id: string): Promise<Esp | undefined> {
    const result = await db.select().from(esps).where(eq(esps.id, id)).limit(1);
    return result[0];
  }

  async getEsps(filters?: { cadernoId?: string; visivel?: boolean }): Promise<Esp[]> {
    const conditions = [];
    if (filters?.cadernoId) {
      conditions.push(eq(esps.cadernoId, filters.cadernoId));
    }
    if (filters?.visivel !== undefined) {
      conditions.push(eq(esps.visivel, filters.visivel));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(esps).where(and(...conditions));
    }
    return await db.select().from(esps);
  }

  async createEsp(insertEsp: InsertEsp): Promise<Esp> {
    const id = randomUUID();
    const now = new Date();
    const values: Esp = {
      id,
      codigo: insertEsp.codigo,
      titulo: insertEsp.titulo,
      tipologia: insertEsp.tipologia,
      revisao: insertEsp.revisao,
      dataPublicacao: insertEsp.dataPublicacao,
      autorId: insertEsp.autorId,
      selo: (insertEsp.selo ?? Selo.NENHUM) as Selo,
      cadernoId: insertEsp.cadernoId,
      visivel: insertEsp.visivel ?? true,
      descricaoAplicacao: insertEsp.descricaoAplicacao ?? null,
      execucao: insertEsp.execucao ?? null,
      fichasReferencia: insertEsp.fichasReferencia ?? null,
      recebimento: insertEsp.recebimento ?? null,
      servicosIncluidos: insertEsp.servicosIncluidos ?? null,
      criteriosMedicao: insertEsp.criteriosMedicao ?? null,
      legislacao: insertEsp.legislacao ?? null,
      referencias: insertEsp.referencias ?? null,
      introduzirComponente: insertEsp.introduzirComponente ?? null,
      constituentesIds: insertEsp.constituentesIds ?? null,
      acessoriosIds: insertEsp.acessoriosIds ?? null,
      acabamentosIds: insertEsp.acabamentosIds ?? null,
      prototiposIds: insertEsp.prototiposIds ?? null,
      aplicacoesIds: insertEsp.aplicacoesIds ?? null,
      constituintesExecucaoIds: insertEsp.constituintesExecucaoIds ?? null,
      fichasReferenciaIds: insertEsp.fichasReferenciaIds ?? null,
      fichasRecebimentoIds: insertEsp.fichasRecebimentoIds ?? null,
      servicosIncluidosIds: insertEsp.servicosIncluidosIds ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(esps).values(values);
    return values;
  }

  async updateEsp(id: string, updates: Partial<InsertEsp>): Promise<Esp | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (updates.codigo !== undefined) updateData.codigo = updates.codigo;
    if (updates.titulo !== undefined) updateData.titulo = updates.titulo;
    if (updates.tipologia !== undefined) updateData.tipologia = updates.tipologia;
    if (updates.revisao !== undefined) updateData.revisao = updates.revisao;
    if (updates.dataPublicacao !== undefined) updateData.dataPublicacao = updates.dataPublicacao;
    if (updates.autorId !== undefined) updateData.autorId = updates.autorId;
    if (updates.selo !== undefined) updateData.selo = updates.selo;
    if (updates.cadernoId !== undefined) updateData.cadernoId = updates.cadernoId;
    if (updates.visivel !== undefined) updateData.visivel = updates.visivel;
    if (updates.descricaoAplicacao !== undefined) updateData.descricaoAplicacao = updates.descricaoAplicacao;
    if (updates.execucao !== undefined) updateData.execucao = updates.execucao;
    if (updates.fichasReferencia !== undefined) updateData.fichasReferencia = updates.fichasReferencia;
    if (updates.recebimento !== undefined) updateData.recebimento = updates.recebimento;
    if (updates.servicosIncluidos !== undefined) updateData.servicosIncluidos = updates.servicosIncluidos;
    if (updates.criteriosMedicao !== undefined) updateData.criteriosMedicao = updates.criteriosMedicao;
    if (updates.legislacao !== undefined) updateData.legislacao = updates.legislacao;
    if (updates.referencias !== undefined) updateData.referencias = updates.referencias;
    if (updates.introduzirComponente !== undefined) updateData.introduzirComponente = updates.introduzirComponente;
    if (updates.constituentesIds !== undefined) updateData.constituentesIds = updates.constituentesIds;
    if (updates.acessoriosIds !== undefined) updateData.acessoriosIds = updates.acessoriosIds;
    if (updates.acabamentosIds !== undefined) updateData.acabamentosIds = updates.acabamentosIds;
    if (updates.prototiposIds !== undefined) updateData.prototiposIds = updates.prototiposIds;
    if (updates.aplicacoesIds !== undefined) updateData.aplicacoesIds = updates.aplicacoesIds;
    if (updates.constituintesExecucaoIds !== undefined) updateData.constituintesExecucaoIds = updates.constituintesExecucaoIds;
    if (updates.fichasReferenciaIds !== undefined) updateData.fichasReferenciaIds = updates.fichasReferenciaIds;
    if (updates.fichasRecebimentoIds !== undefined) updateData.fichasRecebimentoIds = updates.fichasRecebimentoIds;
    if (updates.servicosIncluidosIds !== undefined) updateData.servicosIncluidosIds = updates.servicosIncluidosIds;
    
    await db.update(esps).set(updateData).where(eq(esps.id, id));
    return this.getEsp(id);
  }

  async deleteEsp(id: string): Promise<boolean> {
    const result = await db.delete(esps).where(eq(esps.id, id)).returning({ id: esps.id });
    return result.length > 0;
  }

  // ArquivoMidia methods
  async getArquivosMidiaByEsp(espId: string): Promise<ArquivoMidia[]> {
    return await db.select().from(arquivosMidia).where(eq(arquivosMidia.espId, espId));
  }

  async createArquivoMidia(insertArquivo: InsertArquivoMidia): Promise<ArquivoMidia> {
    const id = randomUUID();
    const now = new Date();
    const values: ArquivoMidia = {
      id,
      espId: insertArquivo.espId,
      tipo: insertArquivo.tipo as TipoArquivo,
      filename: insertArquivo.filename,
      contentType: insertArquivo.contentType,
      fileSize: insertArquivo.fileSize,
      fileData: insertArquivo.fileData,
      createdAt: now,
    };
    await db.insert(arquivosMidia).values(values);
    return values;
  }

  async getArquivoMidiaById(id: string): Promise<ArquivoMidia | undefined> {
    const result = await db.select().from(arquivosMidia).where(eq(arquivosMidia.id, id)).limit(1);
    return result[0];
  }

  async deleteArquivoMidia(id: string): Promise<boolean> {
    const result = await db.delete(arquivosMidia).where(eq(arquivosMidia.id, id)).returning({ id: arquivosMidia.id });
    return result.length > 0;
  }

  // LogAtividade methods
  async createLog(insertLog: InsertLogAtividade): Promise<LogAtividade> {
    const id = randomUUID();
    const now = new Date();
    const values = {
      id,
      userId: insertLog.userId,
      acao: insertLog.acao,
      alvo: insertLog.alvo,
      detalhes: insertLog.detalhes ?? null,
      createdAt: now,
    };
    await db.insert(logsAtividade).values(values);
    return values;
  }

  async getLogs(userId?: string): Promise<LogAtividade[]> {
    if (userId) {
      return await db.select().from(logsAtividade).where(eq(logsAtividade.userId, userId));
    }
    return await db.select().from(logsAtividade);
  }

  // Catalog methods
  async getConstituintes(): Promise<Constituinte[]> {
    return await db.select().from(constituintes).where(eq(constituintes.ativo, true));
  }

  async getConstituenteByNome(nome: string): Promise<Constituinte | undefined> {
    const result = await db.select().from(constituintes).where(eq(constituintes.nome, nome)).limit(1);
    return result[0];
  }

  async createConstituinte(insertConstituinte: InsertConstituinte): Promise<Constituinte> {
    const id = randomUUID();
    const now = new Date();
    const values: Constituinte = {
      id,
      nome: insertConstituinte.nome,
      ativo: insertConstituinte.ativo ?? true,
      createdAt: now,
    };
    await db.insert(constituintes).values(values);
    return values;
  }

  async getAcessorios(): Promise<Acessorio[]> {
    return await db.select().from(acessorios).where(eq(acessorios.ativo, true));
  }

  async getAcessorioByNome(nome: string): Promise<Acessorio | undefined> {
    const result = await db.select().from(acessorios).where(eq(acessorios.nome, nome)).limit(1);
    return result[0];
  }

  async createAcessorio(insertAcessorio: InsertAcessorio): Promise<Acessorio> {
    const id = randomUUID();
    const now = new Date();
    const values: Acessorio = {
      id,
      nome: insertAcessorio.nome,
      ativo: insertAcessorio.ativo ?? true,
      createdAt: now,
    };
    await db.insert(acessorios).values(values);
    return values;
  }

  async getAcabamentos(): Promise<Acabamento[]> {
    return await db.select().from(acabamentos).where(eq(acabamentos.ativo, true));
  }

  async getAcabamentoByNome(nome: string): Promise<Acabamento | undefined> {
    const result = await db.select().from(acabamentos).where(eq(acabamentos.nome, nome)).limit(1);
    return result[0];
  }

  async createAcabamento(insertAcabamento: InsertAcabamento): Promise<Acabamento> {
    const id = randomUUID();
    const now = new Date();
    const values: Acabamento = {
      id,
      nome: insertAcabamento.nome,
      ativo: insertAcabamento.ativo ?? true,
      createdAt: now,
    };
    await db.insert(acabamentos).values(values);
    return values;
  }

  async getPrototiposComerciais(): Promise<PrototipoComercial[]> {
    return await db.select().from(prototiposComerciais).where(eq(prototiposComerciais.ativo, true));
  }

  async getPrototipoComercialByItemMarca(item: string, marca: string): Promise<PrototipoComercial | undefined> {
    const result = await db.select()
      .from(prototiposComerciais)
      .where(and(
        eq(prototiposComerciais.item, item),
        eq(prototiposComerciais.marca, marca)
      ))
      .limit(1);
    return result[0];
  }

  async createPrototipoComercial(insertProto: InsertPrototipoComercial): Promise<PrototipoComercial> {
    const id = randomUUID();
    const now = new Date();
    const values: PrototipoComercial = {
      id,
      item: insertProto.item,
      marca: insertProto.marca,
      ativo: insertProto.ativo ?? true,
      createdAt: now,
    };
    await db.insert(prototiposComerciais).values(values);
    return values;
  }

  async getAplicacoes(): Promise<Aplicacao[]> {
    return await db.select().from(aplicacoes).where(eq(aplicacoes.ativo, true));
  }

  async getAplicacaoByNome(nome: string): Promise<Aplicacao | undefined> {
    const result = await db.select().from(aplicacoes).where(eq(aplicacoes.nome, nome)).limit(1);
    return result[0];
  }

  async createAplicacao(insertAplicacao: InsertAplicacao): Promise<Aplicacao> {
    const id = randomUUID();
    const now = new Date();
    const values: Aplicacao = {
      id,
      nome: insertAplicacao.nome,
      ativo: insertAplicacao.ativo ?? true,
      createdAt: now,
    };
    await db.insert(aplicacoes).values(values);
    return values;
  }

  async getFichasRecebimento(): Promise<FichaRecebimento[]> {
    return await db.select().from(fichasRecebimento).where(eq(fichasRecebimento.ativo, true));
  }

  async getFichaRecebimentoByNome(nome: string): Promise<FichaRecebimento | undefined> {
    const result = await db.select().from(fichasRecebimento).where(eq(fichasRecebimento.nome, nome)).limit(1);
    return result[0];
  }

  async createFichaRecebimento(insertFicha: InsertFichaRecebimento): Promise<FichaRecebimento> {
    const id = randomUUID();
    const now = new Date();
    const values: FichaRecebimento = {
      id,
      nome: insertFicha.nome,
      descricao: insertFicha.descricao ?? null,
      ativo: insertFicha.ativo ?? true,
      createdAt: now,
    };
    await db.insert(fichasRecebimento).values(values);
    return values;
  }

  async getServicosIncluidos(): Promise<ServicoIncluido[]> {
    return await db.select().from(servicosIncluidos).where(eq(servicosIncluidos.ativo, true));
  }

  async getServicoIncluidoByNome(nome: string): Promise<ServicoIncluido | undefined> {
    const result = await db.select().from(servicosIncluidos).where(eq(servicosIncluidos.nome, nome)).limit(1);
    return result[0];
  }

  async createServicoIncluido(insertServico: InsertServicoIncluido): Promise<ServicoIncluido> {
    const id = randomUUID();
    const now = new Date();
    const values: ServicoIncluido = {
      id,
      nome: insertServico.nome,
      descricao: insertServico.descricao ?? null,
      ativo: insertServico.ativo ?? true,
      createdAt: now,
    };
    await db.insert(servicosIncluidos).values(values);
    return values;
  }

  // Itens Especificação methods
  async getItensEspecificacao(filters?: { categoria?: CategoriaItem; ativo?: boolean }): Promise<ItemEspecificacao[]> {
    let query = db.select().from(itensEspecificacao);
    const conditions = [];
    
    if (filters?.categoria) {
      conditions.push(eq(itensEspecificacao.categoria, filters.categoria));
    }
    if (filters?.ativo !== undefined) {
      conditions.push(eq(itensEspecificacao.ativo, filters.ativo));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }

  async getItemEspecificacao(id: string): Promise<ItemEspecificacao | undefined> {
    const result = await db.select().from(itensEspecificacao).where(eq(itensEspecificacao.id, id)).limit(1);
    return result[0];
  }

  async createItemEspecificacao(insertItem: InsertItemEspecificacao): Promise<ItemEspecificacao> {
    const id = randomUUID();
    const now = new Date();
    const values: ItemEspecificacao = {
      id,
      titulo: insertItem.titulo,
      categoria: insertItem.categoria as CategoriaItem,
      subcategoria: insertItem.subcategoria as any,
      descricao: insertItem.descricao,
      ativo: insertItem.ativo ?? true,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(itensEspecificacao).values(values);
    return values;
  }

  async updateItemEspecificacao(id: string, updates: Partial<InsertItemEspecificacao>): Promise<ItemEspecificacao | undefined> {
    const now = new Date();
    const updateData: any = { ...updates, updatedAt: now };
    await db.update(itensEspecificacao)
      .set(updateData)
      .where(eq(itensEspecificacao.id, id));
    return this.getItemEspecificacao(id);
  }

  async deleteItemEspecificacao(id: string): Promise<boolean> {
    await db.update(itensEspecificacao)
      .set({ ativo: false })
      .where(eq(itensEspecificacao.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
