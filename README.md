# Sistema de Automação ESP - SEEDF

Sistema de automação do Caderno de Especificações (ESP) da Secretaria de Estado de Educação do Distrito Federal.

## 🎨 Identidade Visual

- **Azul Institucional**: `#0361ad`
- **Amarelo Institucional**: `#fae947`
- **Conformidade**: WCAG AA

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Executar aplicação (frontend + backend)
npm run dev
```

A aplicação estará disponível em:
- Frontend: http://localhost:5000
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/api/docs

## 🔐 Credenciais de Teste

### Arquiteto (Criar/Editar ESPs)
- Email: `arquiteto@seedf.df.gov.br`
- Senha: `Arquiteto123!`

### Chefe de Núcleo (Validar e Acompanhar)
- Email: `chefe@seedf.df.gov.br`
- Senha: `Chefe123!`

### Gerente (Validar e Exportar PDF)
- Email: `gerente@seedf.df.gov.br`
- Senha: `Gerente123!`

### Diretor (Aprovar e Exportar DOCX)
- Email: `diretor@seedf.df.gov.br`
- Senha: `Diretor123!`

## 📋 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/logout` - Fazer logout
- `GET /api/auth/me` - Obter usuário atual

### Cadernos
- `GET /api/cadernos` - Listar cadernos
- `GET /api/cadernos/:id` - Obter caderno
- `POST /api/cadernos` - Criar caderno
- `PATCH /api/cadernos/:id` - Atualizar caderno
- `DELETE /api/cadernos/:id` - Deletar caderno

### ESPs
- `GET /api/esp` - Listar ESPs
- `GET /api/esp/:id` - Obter ESP
- `POST /api/esp` - Criar ESP
- `PATCH /api/esp/:id` - Atualizar ESP
- `DELETE /api/esp/:id` - Deletar ESP

### Exportação
- `POST /api/export/pdf/:espId` - Exportar PDF
- `POST /api/export/docx/:espId` - Exportar DOCX

### Logs
- `GET /api/logs` - Obter logs de atividade

### Saúde
- `GET /api/health` - Verificar status do sistema

## 🔒 Permissões (RBAC)

| Perfil | Permissões |
|--------|------------|
| **ARQUITETO** | Criar/Editar ESP, Criar/Editar Caderno, Upload de arquivos |
| **CHEFE_DE_NUCLEO** | Criar/Editar Caderno, Visualizar logs, Validar ESP |
| **GERENTE** | Deletar Caderno, Visualizar logs, Exportar PDF |
| **DIRETOR** | Todas as permissões, Exportar DOCX, Aprovar ESP |

## 📁 Estrutura do Projeto

```
/
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── pages/        # Páginas da aplicação
│   │   └── lib/          # Utilitários
├── server/               # Backend Express
│   ├── routes/           # Rotas da API
│   ├── middleware/       # Autenticação, RBAC, Validação
│   ├── services/         # Geração de PDF/DOCX
│   └── utils/            # Logging
├── shared/
│   └── schema.ts         # Schemas compartilhados
└── design_guidelines.md  # Guidelines de design
```

## 🛠️ Tecnologias

### Frontend
- React + TypeScript + Vite
- Tailwind CSS
- Wouter (routing)
- TanStack Query
- React Hook Form + Zod
- Shadcn/ui + Radix UI
- Lucide React (icons)

### Backend
- Express + TypeScript
- JWT + bcrypt
- Zod (validation)
- Winston (logging)
- PDFKit + docx

## 📖 Documentação Completa

Consulte `estruturação.md` para documentação detalhada do projeto.

## ✅ Status do Projeto

### Completado
- ✅ Frontend completo com todas as páginas
- ✅ Backend com autenticação JWT
- ✅ RBAC completo
- ✅ CRUD de Cadernos e ESPs
- ✅ Exportação PDF e DOCX
- ✅ Sistema de logs
- ✅ Seed com dados de teste
- ✅ Design institucional WCAG AA

### Próximos Passos (Fora do MVP)
- Integração real com MongoDB GridFS
- Recuperação de senha por e-mail
- Notificações em tempo real
- Versioning automático de ESPs
- Anexos de arquivos via upload

## 📝 Licença

Sistema governamental - SEEDF © 2025
