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
  StatusCaderno,
  Selo,
  users,
  cadernos,
  esps,
  arquivosMidia,
  logsAtividade,
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
  createArquivoMidia(arquivo: InsertArquivoMidia): Promise<ArquivoMidia>;
  deleteArquivoMidia(id: string): Promise<boolean>;
  
  // LogAtividade methods
  createLog(log: InsertLogAtividade): Promise<LogAtividade>;
  getLogs(userId?: string): Promise<LogAtividade[]>;
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
    const values = {
      id,
      nome: insertUser.nome,
      email: insertUser.email,
      hashSenha: insertUser.hashSenha,
      perfil: insertUser.perfil,
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
    const values = {
      id,
      titulo: insertCaderno.titulo,
      descricao: insertCaderno.descricao ?? null,
      status: insertCaderno.status ?? StatusCaderno.EM_ANDAMENTO,
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
    const values = {
      id,
      codigo: insertEsp.codigo,
      titulo: insertEsp.titulo,
      tipologia: insertEsp.tipologia,
      revisao: insertEsp.revisao,
      dataPublicacao: insertEsp.dataPublicacao,
      autorId: insertEsp.autorId,
      selo: insertEsp.selo ?? Selo.NENHUM,
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
    const values = {
      id,
      espId: insertArquivo.espId,
      tipo: insertArquivo.tipo,
      filename: insertArquivo.filename,
      contentType: insertArquivo.contentType,
      fileIdMongo: insertArquivo.fileIdMongo,
      createdAt: now,
    };
    await db.insert(arquivosMidia).values(values);
    return values;
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
}

export const storage = new DatabaseStorage();
