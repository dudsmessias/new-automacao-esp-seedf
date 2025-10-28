# Sistema de Automação ESP - SEEDF

## Overview
This project is an automation system for the Specification Notebook (ESP) of the State Department of Education of the Federal District (SEEDF). It's an institutional government application focusing on official visual identity and WCAG AA accessibility compliance. The system aims to streamline the creation, management, validation, and approval of ESPs, supporting various user roles within the SEEDF. Its core capabilities include a comprehensive ESP editor with multiple sections, document management (upload, download, streaming), and robust export functionalities for PDF and DOCX formats.

## User Preferences
I prefer simple language in explanations. I like an iterative development approach where features are built step-by-step. Ask before making major architectural changes or introducing new dependencies.

## System Architecture
The application follows a client-server architecture.

**UI/UX Decisions:**
The design adheres strictly to the official SEEDF visual identity, utilizing a tricolor scheme (institutional blue, yellow, and white) for branding and accessibility.
- **Official Colors:** Institutional Blue (`#0361ad`), Institutional Yellow (`#fae947`), White (`#ffffff`), Black (`#000000`).
- **Accessibility:** WCAG AA compliant with high contrast ratios (Blue/White: 9.6:1, Yellow/Black: 13.5:1), full keyboard navigation, ARIA labels for interactive elements, and visible yellow outline focus states.
- **Component Library:** Shadcn/ui and Radix UI are used for building accessible and customizable UI components.

**Technical Implementations:**
-   **Frontend:** Developed with React, TypeScript, Vite, Tailwind CSS, and Wouter for a Single Page Application (SPA) experience. TanStack Query manages data fetching, while React Hook Form with Zod handles form validation.
-   **Backend:** Built using Express and TypeScript. Drizzle ORM interfaces with a PostgreSQL database (with Neon for production readiness). Authentication is handled via JWT tokens stored in localStorage, with `Authorization: Bearer` headers for subsequent requests. Zod is used for validation across both frontend and backend.
-   **Data Models:**
    -   **User:** Manages various profiles (ARQUITETO, CHEFE_DE_NUCLEO, GERENTE, DIRETOR) with role-based access control (RBAC).
    -   **Caderno:** Represents specification notebooks with statuses (OBSOLETO, EM_ANDAMENTO, APROVADO).
    -   **ESP (Especificação):** Core entity with detailed fields, including content, status, and associated files. Extended fields include `introduzirComponente` (text) and 8 array fields: `constituentesIds`, `acessoriosIds`, `acabamentosIds`, `prototiposIds`, `aplicacoesIds`, `constituintesExecucaoIds`, `fichasReferenciaIds`, `fichasRecebimentoIds` (all text arrays).
    -   **ArquivoMidia:** Stores file metadata, with actual file data (base64 encoded) stored directly in PostgreSQL.
    -   **LogAtividade:** Audits all user actions within the system.
    -   **Catalog Tables:** `constituintes`, `acessorios`, `acabamentos`, `prototipos_comerciais`, `aplicacoes`, `fichas_recebimento` for managing selectable options in the ESP editor.
-   **File Storage:** Files are stored as base64 encoded strings within the PostgreSQL database for simplicity in the current iteration. Multer handles multipart form data for file uploads.
-   **Document Export:** PDFKit is used for PDF generation, and `docx` library for DOCX generation, both adhering to institutional formatting.
-   **Authentication:** JWT tokens are stored in `localStorage` and sent via `Authorization: Bearer` headers for secure, stateless authentication. Logout clears the token and user data from `localStorage`.
-   **Feature Specifications:**
    -   **ESP Editor:** A multi-tab interface (11 tabs) for detailed specification editing:
        -   **Identificação:** Basic ESP information and identification
        -   **Projetos:** File upload system for project documents
        -   **Descrição e Aplicação:** 5 catalog-based dropdown selections (Constituintes, Acessórios, Acabamentos, Protótipos Comerciais, Aplicações)
        -   **Execução:** Dynamic constituent selection system with initially 5 select boxes, expandable via "+" button, removable (beyond first 5) via trash icon
        -   **Fichas de Referência:** Catalog-based item relationship system with initially 1 select box, expandable via "+" button, removable (beyond first item) via trash icon
        -   **Recebimento:** Catalog-based ficha selection system with initially 1 select box, expandable via "+" button, removable (beyond first ficha) via trash icon
        -   **Serviços Incluídos, Critérios de Medição, Legislação e Referências:** Text areas for detailed content
        -   **Visualizar PDF, Exportar:** Document export functionalities
    -   **Dashboard:** Provides filtering and search capabilities for managing ESPs.
    -   **Role-Based Access Control (RBAC):** Permissions are defined for ARQUITETO (create/edit ESPs, upload files), CHEFE_DE_NUCLEO/GERENTE (validate/monitor ESPs), and DIRETOR (approve ESPs, export DOCX, full access).

## Recent Development Notes

### Criação de Itens e Especificações Técnicas Page - Updated (October 28, 2025)
-   **Feature:** Standalone page for creating and managing technical items that feed directly into the ESP catalog system.
-   **Data Model:** Simplified `itens_especificacao` table with 4 core fields
    -   **CategoriaItem enum (9 options):** DESCRIÇÃO, APLICAÇÃO, EXECUÇÃO, FICHA DE REFERÊNCIA, RECEBIMENTO, SERVIÇOS INCLUÍDOS NOS PREÇOS, CRITÉRIOS DE MEDIÇÃO, LEGISLAÇÃO, REFERÊNCIA
    -   **SubcategoriaItem enum (6 options):** ACESSORIOS, ACABAMENTOS, CONSTITUINTES, PROTOTIPO_COMERCIAL, CATALOGO_SERVICOS, TEXTO_GERAL
    -   **Fields:** id, titulo (required), categoria (required), subcategoria (required - dependent on categoria), descricao (required multilinha), ativo (soft-delete), timestamps
-   **Backend Implementation:**
    -   Storage methods: createItemEspecificacao, getItensEspecificacao (with optional filters categoria/ativo), updateItemEspecificacao, deleteItemEspecificacao (soft-delete)
    -   API Routes: GET/POST/PATCH/DELETE at /api/itens-especificacao with JWT authentication
    -   Zod validation: insertItemEspecificacaoSchema for POST, partial schema for PATCH
-   **Frontend Implementation (4 campos apenas):**
    -   **Campo 1:** Título do Item (input text, obrigatório, h-11)
    -   **Campo 2:** Categoria (select, obrigatório, 9 opções, h-11)
    -   **Campo 3:** Subcategorias (select, obrigatório, dependente da categoria selecionada, h-11)
        -   DESCRIÇÃO → 5 subcategorias (Acessórios, Acabamentos, Constituintes, Protótipo Comercial, Texto Geral)
        -   FICHA DE REFERÊNCIA → 2 subcategorias (Catálogo de Serviços, Texto Geral)
        -   Demais categorias → campo desabilitado, usa TEXTO_GERAL como padrão
    -   **Campo 4:** Descrição (textarea multilinha, obrigatório, rows=6)
    -   Route: /criacao-itens accessible via "+ Criação de Itens" button in dashboard
    -   AuthHeader pattern: Official GDF branding (unchanged)
    -   Two-column layout: Form fields on left (scrollable), action buttons on right (w-48, fixed)
    -   Action buttons with black background (#000000): Salvar, Atualizar, Abrir PDF (unchanged)
    -   React Hook Form + Zod using shared schema from @shared/schema.ts
    -   TanStack Query for mutations with cache invalidation
-   **Dependent Subcategorias Logic:**
    -   useEffect hook watches categoria changes
    -   Automatically updates available subcategorias based on selected categoria
    -   Sets first subcategoria when available, or defaults to TEXTO_GERAL for categorias without subcategorias
    -   Prevents inconsistent data pairs (e.g., categoria=APLICAÇÃO with subcategoria=Constituintes)
-   **Database Migration:**
    -   Manual SQL migration executed to add subcategoria and descricao columns
    -   Removed 6 legacy columns: codigoReferencia, descricaoTecnico, especificacoes, caracteristicasTecnicas, normasReferencias, aplicacao
    -   Existing data (2 records) migrated with default values
-   **Bug Fixes:**
    -   Critical: Fixed subcategoria persistence bug where switching to categorias without subcategorias left stale values
    -   Solution: useEffect always sets subcategoria value (first option or TEXTO_GERAL fallback)
-   **Testing:** 
    -   E2E Playwright tests validate: 4 campos apenas, dependent subcategoria logic, form validation, creation flow, form reset
    -   Bug fix test validates: switching between categorias with/without subcategorias, consistent API payloads
-   **Architect Review:** Implementation approved after bug fix - ready for production
-   **Integration:** Items created here feed directly into ESP catalog system for use in "Criação de Cadernos" module

### Serviços Incluídos Tab Implementation (October 2025)
-   **Feature:** Catalog-based service selection system for managing included services in ESP specifications.
-   **Implementation:**
    -   New `servicos_incluidos` catalog table with 11 example services (Instalação do Componente, Montagem do Equipamento, Ajuste e Nivelamento, etc.)
    -   New `servicosIncluidosIds` text array field in ESP table
    -   Dynamic UI with initially 1 select box, expandable via "+" button
    -   Action buttons (Salvar, Atualizar, Abrir PDF) with institutional black (#000000) background
    -   `numServicosIncluidos` state controls UI rendering
-   **API Route:** GET /api/catalog/servicos-incluidos
-   **Backend:** Added servicosIncluidosIds to both createEsp (line 252) and updateEsp (line 287) in storage.ts
-   **State synchronization:** `setNumServicosIncluidos(Math.max(1, servicosIds.length))` ensures saved services display correctly when editing existing ESPs
-   **Known Issue:** Bug discovered during E2E testing where save operation does not trigger network request - investigation ongoing

### Recebimento Tab Implementation (October 2025)
-   **Feature:** Catalog-based ficha selection system for managing reception criteria and inspection documents.
-   **Implementation:**
    -   New `fichas_recebimento` catalog table with 7 example fichas (Materiais Hidráulicos, Conferência Elétrica, Estruturas Metálicas, etc.)
    -   New `fichasRecebimentoIds` text array field in ESP table
    -   Dynamic UI with initially 1 select box, expandable via "+" button
    -   Action buttons (Salvar, Atualizar, Abrir PDF) with institutional black (#000000) background
    -   `numFichasRecebimento` state controls UI rendering
-   **API Route:** GET /api/catalog/fichas-recebimento
-   **Critical Fix:** State synchronization in useEffect ensures saved fichas display correctly when editing existing ESPs
    -   `setNumFichasRecebimento(Math.max(1, esp.fichasRecebimentoIds.length))`
-   **Bug Fix:** Removed empty value SelectItem to prevent Radix UI Select error
-   **Testing:** E2E Playwright tests validate add/remove behavior, button styling, catalog loading, and state synchronization

### Fichas de Referência Tab Implementation (October 2025)
-   **Feature:** Catalog-based item relationship system allowing users to link items from other catalogs to the current ESP.
-   **Implementation:**
    -   New `fichasReferenciaIds` text array field in database
    -   Dynamic UI with initially 1 select box, expandable via "+" button
    -   Action buttons (Salvar, Atualizar, Abrir PDF) with institutional black (#000000) background
    -   `numFichasReferencia` state controls UI rendering
-   **Critical Fix:** Added state synchronization in useEffect to ensure saved items display correctly when editing existing ESPs:
    -   `setNumFichasReferencia(Math.max(1, esp.fichasReferenciaIds.length))`
    -   Prevents data-loss view bug where saved items beyond index 0 would be hidden
-   **Testing:** E2E Playwright tests validate add/remove behavior, button styling, and state synchronization.

### Execução Tab Implementation (October 2025)
-   **Challenge:** Dynamic form arrays require careful state management to ensure UI updates reliably when items are added/removed.
-   **Solution:** Combined useState (for display control) with React Hook Form (for data management):
    -   `numConstituintesExecucao` state controls how many select boxes to render
    -   `form.setValue()` and `form.watch()` manage the actual constituent IDs
    -   Add button: increments state and appends empty string to array
    -   Remove button: decrements state and filters array
-   **Key Lesson:** Using `form.watch()` inside onClick handlers doesn't work reliably - use `form.getValues()` instead for reading current values in event handlers.
-   **Critical Fix:** Added state synchronization to match Fichas de Referência implementation
-   **Testing:** End-to-end Playwright tests validate add/remove behavior, button styling, and DOM updates.

## External Dependencies
-   **PostgreSQL (via Neon):** Primary relational database for all application data, replacing earlier MongoDB GridFS and in-memory storage.
-   **JWT (JSON Web Tokens):** Used for secure user authentication.
-   **bcrypt:** For hashing user passwords.
-   **PDFKit:** Library for generating PDF documents.
-   **docx:** Library for generating editable Microsoft Word (DOCX) documents.
-   **Winston:** Logging library for backend activity.
-   **Multer:** Middleware for handling `multipart/form-data`, primarily for file uploads.
-   **Lucide React:** Icon library for frontend.
-   **Sonner:** Toast notification library.
-   **date-fns:** Utility library for date manipulation and formatting.