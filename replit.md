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
- **Accessibility:** WCAG AA compliant with high contrast ratios, full keyboard navigation, ARIA labels, and visible yellow outline focus states.
- **Component Library:** Shadcn/ui and Radix UI are used for building accessible and customizable UI components.

**Technical Implementations:**
-   **Frontend:** Developed with React, TypeScript, Vite, Tailwind CSS, and Wouter for a Single Page Application (SPA) experience. TanStack Query manages data fetching, while React Hook Form with Zod handles form validation.
-   **Backend:** Built using Express and TypeScript. Drizzle ORM interfaces with a PostgreSQL database. Authentication is handled via JWT tokens stored in localStorage. Zod is used for validation across both frontend and backend.
-   **Data Models:**
    -   **User:** Manages various profiles (ARQUITETO, CHEFE_DE_NUCLEO, GERENTE, DIRETOR) with role-based access control (RBAC).
    -   **Caderno:** Represents specification notebooks with statuses (OBSOLETO, EM_ANDAMENTO, APROVADO).
    -   **ESP (Especificação):** Core entity with detailed fields, including content, status, and associated files. Extended fields include `introduzirComponente` (text) and several array fields for catalog item IDs.
    -   **ArquivoMidia:** Stores file metadata.
    -   **LogAtividade:** Audits all user actions.
    -   **ItensEspecificacao:** Unified catalog table for managing all selectable options in the ESP editor, categorized by `CategoriaItem` and `SubcategoriaItem`.
-   **File Storage:** Files are stored as base64 encoded strings within the PostgreSQL database. Multer handles multipart form data for file uploads.
-   **Document Export:** PDFKit is used for PDF generation, and `docx` library for DOCX generation, both adhering to institutional formatting.
-   **Authentication:** JWT tokens are stored in `localStorage` and sent via `Authorization: Bearer` headers.
-   **Feature Specifications:**
    -   **ESP Editor:** A multi-tab interface (11 tabs) for detailed specification editing, integrating dynamically with the unified `ItensEspecificacao` catalog.
    -   **Criação de Itens:** A standalone page for creating and managing technical items (`ItensEspecificacao`) that feed directly into the ESP catalog system.
    -   **Dashboard:** Provides filtering and search capabilities for managing ESPs.
    -   **Role-Based Access Control (RBAC):** Permissions are defined for ARQUITETO (create/edit), CHEFE_DE_NUCLEO/GERENTE (validate/monitor), and DIRETOR (approve, export DOCX, full access).
    -   **Unified Catalog System:** `itens_especificacao` serves as the single source of truth for all catalog data, ensuring consistency and automatic integration of new items into the ESP Editor.

## External Dependencies
-   **PostgreSQL (via Neon):** Primary relational database.
-   **JWT (JSON Web Tokens):** For secure user authentication.
-   **bcrypt:** For hashing user passwords.
-   **PDFKit:** Library for generating PDF documents.
-   **docx:** Library for generating Microsoft Word (DOCX) documents.
-   **Winston:** Logging library for backend activity.
-   **Multer:** Middleware for handling file uploads.
-   **Lucide React:** Icon library for frontend.
-   **Sonner:** Toast notification library.
-   **date-fns:** Utility library for date manipulation.