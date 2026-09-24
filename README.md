# AISE Lab Studio

**Interactive Laboratory Environment for AI in Software Engineering**  
**Course Code:** MAI5124 AI in Software Engineering  
**Institution:** School of Engineering and Technology

---

## 1. Overview

**AISE Lab Studio** is a Master's-level interactive teaching and laboratory platform built for **MAI5124 AI in Software Engineering**. The platform bridges software architecture, real Python execution in Pyodide, behavioral design, visual engineering pipelines (React Flow & Blockly), automated testing, and rich academic report writing with direct Microsoft Word (`.docx`) generation.

### Key Architectural Tenets
- **GitHub-First & Vercel Ready:** Free of any vendor lock-in or proprietary cloud dependencies (Zero Firebase, Zero Google Cloud DB requirement).
- **Modular Lab Architecture:** Laboratories reside in independent `/labs/labXX-...` folders with self-contained manifests, starter files, visual topologies, and test suites.
- **In-Browser Sandboxed Execution:** Real Python runtime via Pyodide Web Workers, with stdout, stderr, and Matplotlib graphic figure rendering.
- **Academic DOCX Generator:** Generates compliant Microsoft Word technical reports containing embedded execution traces, figures, code blocks, and student metadata.
- **Role-Based Security:** Strict server-side verification for `STUDENT`, `LECTURER`, and `ADMIN` roles. Locked laboratories cannot be accessed by manually tampering with URLs.
- **Student Initial Password Policy:** Student accounts are roster-imported. Initial password is their Student ID, with a mandatory first-login password update enforced server-side.

---

## 2. Default Seed Accounts

| Role | Email | Student ID | Initial Password | Mandatory Change |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@sunway.edu.my` | - | `admin12345` | No |
| **Lecturer** | `lecturer@sunway.edu.my` | - | `lecturer12345` | No |
| **Student 1** | `student1@imail.sunway.edu.my` | `24012345` | `24012345` | **Yes (on first login)** |
| **Student 2** | `student2@imail.sunway.edu.my` | `24012346` | `24012346` | **Yes (on first login)** |
| **Student 3** | `student3@imail.sunway.edu.my` | `24012347` | `Password123!` | No (Already submitted Lab 01) |

---

## 3. Technology Stack

- **Framework:** Next.js / React 19 / TypeScript / Vite full-stack architecture with Express backend
- **Styling:** Tailwind CSS (Clean, minimalist academic design system with zero visual clutter)
- **Database:** PostgreSQL compatible (Drizzle ORM schema) + instant in-memory development store
- **Code Editor:** Monaco Editor (multi-file tabs, syntax highlighting, keyboard shortcuts)
- **Python Execution:** Pyodide Web Worker (with NumPy, Matplotlib plot export)
- **Visual Design:** React Flow (@xyflow/react) and Google Blockly
- **Document Generation:** `docx` npm library for native Word `.docx` file generation & `jszip` for bulk report downloads

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js 18.x or 20.x+
- npm or pnpm

### Setup Steps
```bash
# 1. Clone the repository
git clone https://github.com/your-org/aise-lab-studio.git
cd aise-lab-studio

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start full-stack development server
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 5. Deployment to Vercel

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of AISE Lab Studio"
   git branch -M main
   git remote add origin https://github.com/<your-user>/aise-lab-studio.git
   git push -u origin main
   ```
2. Import the repository in [Vercel Dashboard](https://vercel.com/new).
3. In **Project Settings > Environment Variables**, add:
   - `AUTH_SECRET`: A secure random 32+ character string.
   - `DATABASE_URL`: (Optional) Your PostgreSQL connection string (Neon, Supabase, AWS RDS, etc.).
   - `BLOB_READ_WRITE_TOKEN`: (Optional) Vercel Blob token for cloud image uploads.
4. Click **Deploy**.

---

## 6. Project Structure

```
/
├── server.ts                    # Full-stack Express server with API routes & Vite middleware
├── /labs                        # Modular Laboratories
│   ├── types.ts                 # Manifest, test, and snippet schemas
│   ├── registry.ts              # LabRegistry dynamic loader
│   ├── lab01-behavioral-programming/   # Reference Implementation
│   ├── lab02-requirement-prioritization/
│   └── ... through lab11 & practical exam
├── /lib
│   ├── /db                      # Drizzle ORM schema & unified data store
│   ├── /auth                    # HMAC session tokens, password hashing, and guards
│   ├── /storage                 # StorageProvider abstraction (Local & Vercel Blob)
│   ├── /runners                 # PyodideRunner & ExecutionResult abstractions
│   ├── /reports                 # Native .docx and .zip generators
│   └── /ai                      # Optional AITutorProvider abstraction
├── /src
│   ├── App.tsx                  # Main client routing & state coordinator
│   ├── /components              # Modular UI components (Workspace, Editor, Report, Roster)
│   ├── index.css                # Academic typography & Tailwind rules
│   └── main.tsx                 # React DOM mount point
└── /docs
    └── LAB_MODULE_SPEC.md       # Full specification for authoring new labs
```

---

## 7. Adding a New Laboratory

Refer to [LAB_MODULE_SPEC.md](docs/LAB_MODULE_SPEC.md) for full details. Create `/labs/labXX-<name>/` with `manifest.json`, `instructions.md`, `report-template.json`, `starter/`, `snippets.json`, and `tests/public-tests.json`, and register it in `registry.ts`.
