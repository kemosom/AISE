# AISE Lab Studio

Interactive laboratory environment for **MAI5124 AI in Software Engineering**.

AISE Lab Studio is designed as an open-access teaching environment. Students do not create accounts or sign in. They open an available laboratory, read and annotate the theory/lab sheet, enter the interactive coding workspace, run code and tests, prepare the integrated laboratory report, and export their work.

## Current teaching workflow

```text
Laboratory list
    ↓
Theory & Lab Sheet
    ↓
Pen / highlighter / notes
    ↓
Word or PDF export
    ↓
Begin Lab
    ↓
Monaco Editor + Pyodide
    ↓
Run + Tests
    ↓
Integrated Report
    ↓
Word export
```

Only laboratories whose teaching content is ready should be unlocked. **Lab 01 is the current reference module.** Labs 02–11 remain visible as future modules while they are developed. There is no practical-exam module in the current course design; learning across the laboratories should feed into the Final Project.

## Open-access persistence

There is no student login in the current teaching mode.

For open-access students, the following are stored locally in the student's browser:

- working code files,
- report draft,
- test statistics,
- checkpoints,
- local submission snapshot,
- theory annotations and sticky notes.

The student's **name and student ID are entered only inside the report**.

Because browser-local data can be lost if browser storage is cleared or the student changes computer, students should use the available Word/PDF export functions as durable copies of their work.

The server still contains infrastructure that can support an authenticated deployment later, but it is not required for the current student workflow.

## Technology

- React 19 + TypeScript
- Vite
- Express development/application server
- Tailwind CSS
- Monaco Editor
- Pyodide for real Python execution in the browser
- Blockly for block-to-code activities
- `docx` for genuine Microsoft Word generation
- local browser persistence for open-access student work

The repository also contains optional Supabase/database infrastructure for future deployment work. It is not part of the current open-access Lab 01 workflow.

## Local development

Requirements:

- Node.js 22+ recommended
- npm

```bash
git clone https://github.com/kemosom/AISE.git
cd AISE
npm install
npm run dev
```

The development server prints the local URL when it starts.

Useful checks:

```bash
npm run lint
npm run build
```

## Laboratory authoring model

Teaching content is kept under `/labs`. Application components should be changed only when the teaching platform itself needs a new capability.

Lab 01 is structured as:

```text
labs/
└── lab01-behavioral-programming/
    ├── manifest.json
    ├── theory.md
    ├── lab-sheet.md
    ├── starter/
    │   ├── main.py
    │   ├── risk_model.py
    │   └── helpers.py
    ├── tests/
    │   └── public-tests.json
    ├── report-template.json
    ├── snippets.json
    ├── blocks.json
    └── visual-nodes.json
```

### What to edit

| Goal | File |
| --- | --- |
| Change the theory students read | `theory.md` |
| Change practical instructions/tasks | `lab-sheet.md` |
| Change module title/outcomes/features | `manifest.json` |
| Change starter Python code | `starter/main.py` |
| Change supplied helper engine | `starter/helpers.py` |
| Change automated checks | `tests/public-tests.json` |
| Change the student report structure | `report-template.json` |
| Change reusable code snippets | `snippets.json` |
| Change Blockly components | `blocks.json` |
| Change the initial visual architecture | `visual-nodes.json` |

For normal academic editing of a laboratory, you should **not need to edit React components**.

## Course-wide academic design rule

Labs 1–11 are not independent coding exercises. Each laboratory must contribute deliberately toward the course CLO/PLO structure and the Final Project.

The standing design rule is:

```text
real software-engineering problem
        ↓
AI concept / method / tool
        ↓
compare or justify alternatives
        ↓
apply the selected approach
        ↓
verify or measure behavior
        ↓
critically interpret the evidence
        ↓
transfer the capability toward the Final Project
```

Every lab must state its **primary, secondary, or preparatory** CLO/PLO contribution. Do not claim CLO3/PLO7 merely because a number is displayed; students must actually interpret quantitative evidence when that outcome is targeted. Likewise, CLO2/PLO2 requires a genuine selection or justification task, not only following a preselected method.

## Lab 01 academic design

Lab 01 uses a realistic **AI-assisted software release** scenario.

Students work with a supplied supervised k-nearest-neighbours defect-risk model that produces a release-risk prediction from historical software-change characteristics. Behavioral Programming is then used to keep AI recommendations separate from deterministic engineering policies such as failed-test blocking, critical-security blocking, confidence thresholds, and human review.

The core learning question is:

> How should an AI recommendation be integrated into a software workflow without allowing the AI component to violate explicit engineering requirements?

Students first compare three integration strategies and justify the most appropriate architecture using auditability, maintainability, deterministic enforcement, retraining dependence, and human-review handling. They then run an AI-only baseline, implement one independent `release_guardrail()` b-thread, enable it, explore multiple pull-request cases, verify the stated requirements, and interpret the difference between **AI prediction** and **software authority**.

This practical is designed to contribute a reusable pattern for the course Final Project: **AI prediction/recommendation + explicit software policy/guardrail + measurable verification**.

## Repository structure

```text
/
├── labs/                       # Academic laboratory modules
│   ├── registry.ts             # Loads lab assets into the application
│   ├── types.ts
│   └── lab01-behavioral-programming/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── LabTheoryArticle.tsx
│   │   ├── LabWorkspace.tsx
│   │   ├── MonacoEditorPanel.tsx
│   │   ├── VisualDesignPanel.tsx
│   │   ├── TestRunnerPanel.tsx
│   │   └── ReportWorkspace.tsx
│   └── lib/
├── lib/
│   ├── runners/                # Pyodide runner
│   ├── reports/                # DOCX/ZIP generation
│   ├── storage/
│   └── supabase/               # Optional future backend integration
├── docs/
│   └── LAB_MODULE_SPEC.md
├── server.ts
└── package.json
```

## Adding the next lab

Do not duplicate large teaching strings inside `registry.ts`.

Use Lab 01 as the pattern:

1. Create `labs/lab02-<slug>/`.
2. Add `manifest.json`.
3. Write `theory.md`.
4. Write `lab-sheet.md`.
5. Add starter files.
6. Add meaningful public tests.
7. Define the report template.
8. Add snippets/blocks/visual nodes only where pedagogically useful.
9. Register those files in `labs/registry.ts`.
10. Keep the module locked until its content and tests have been reviewed.

See `docs/LAB_MODULE_SPEC.md` for the detailed module contract.

## One final submission per student

Final submissions are protected at the **database level**, not only by the browser UI.

For each laboratory, Supabase enforces a unique normalized pair:

```text
lab_id + student_code
```

This means the same student ID cannot submit the same lab twice even if the student:

- changes browser,
- uses incognito/private mode,
- clears browser storage,
- changes device,
- receives a new anonymous-auth session.

The client also performs a safe pre-check through `public.has_submitted_lab(...)` so students receive a clear message before upload. The unique database index remains the final authority and protects against race conditions.

Because the site deliberately has no student login, this guarantees **one submission per claimed student ID**, not proof of the student's real identity. If institutional identity assurance is required later, add Sunway SSO/email authentication or roster-linked access tokens.

## Student report submission to Supabase

The open-access student interface has no visible login. When a student submits a final report, the browser creates an **invisible Supabase anonymous-auth session**. This gives the submission a real `auth.uid()` so Row Level Security can protect the student's record and private Word file without adding a login screen.

Final submission stores:

- the generated `.docx` file in the private Supabase Storage bucket `lab-submissions`,
- student name and student ID in `public.submissions`,
- the structured report snapshot,
- the student's code snapshot,
- the latest requirement-verification counts,
- the DOCX storage path and filename,
- the server-generated submission timestamp.

Run the migrations in order, including:

```text
supabase/migrations/003_open_access_docx_submissions.sql
```

In Supabase Dashboard, enable **Authentication → Providers → Anonymous Sign-Ins**.

Vercel also needs:

```text
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<project publishable key>

# Legacy projects may instead use:
VITE_SUPABASE_ANON_KEY=<project anon key>
```

The anon/publishable key is designed for browser use. Do not expose a Supabase service-role key in `VITE_*` variables.

The generated Word document is stored in **Supabase Storage**, while PostgreSQL stores the submission record and file metadata. This is preferable to putting DOCX binary data directly into a database row.

## Lab 02: Optional embedded Hugging Face AI Assistant

Lab 02 includes a dedicated AI Assistant tab backed by a real open-weight LLM
through Hugging Face Inference Providers. The student's browser never receives
the Hugging Face credential.

Configure these **server-only** Vercel environment variables and redeploy:

```text
HF_TOKEN=hf_...                       # fine-grained token, "Make calls to Inference Providers"
HF_MODEL=Qwen/Qwen3-14B:cheapest     # optional model override
LAB02_AI_PUBLIC_ENABLED=false       # keep false until lab is approved and released
```

The Vercel function is `api/lab02-chat.ts`; it uses
`https://router.huggingface.co/v1/chat/completions`. Get a fine-grained token at
https://huggingface.co/settings/tokens. Check current inference credits and
provider model availability in Hugging Face before teaching.

**While Lab 02 is locked:** the chatbot only accepts an instructor capability
issued after server-side validation of the existing instructor code. The student
lab and public chat remain closed. A successful instructor unlock creates an
in-memory, lab-scoped, two-hour signed chat capability. The instructor may
try the actual student interface without needing to expose the key.

**Before enabling public chat:** the included per-IP limiter is only
best-effort *within each warm serverless instance* and is not a global quota.
Enable a durable shared usage counter/limiter and a provider-side cost/spend
limit before setting `LAB02_AI_PUBLIC_ENABLED=true`. The open-access student
site has no login, so unrestricted public usage would risk quota exhaustion
and unexpected billing. Do not put `HF_TOKEN` in `VITE_*` or source code.

The chatbot is *not* live retrieval-augmented generation: its server-side
system context contains verified, concise excerpts from official Spotify
documentation, with direct source links. Students must still inspect the
real documentation and verify model claims. Fictional classroom priorities
are labeled as assumptions, not actual Spotify requirements research.

## Instructor-only answer material

Instructor reference material is **not stored as plaintext in the public repository or client bundle**.

The deployed instructor endpoint requires two server-side environment variables:

- `INSTRUCTOR_ADMIN_CODE`: the private code entered by the instructor.
- `INSTRUCTOR_CONTENT_KEY`: the AES-256 key used to decrypt the instructor payload.

These values must be configured as server-side deployment variables. Do not prefix them with `VITE_`, because Vite-prefixed variables are exposed to browser code.

The public repository contains only the encrypted instructor payload. The complete reference solution, expected outputs, teaching sequence, sample report, common mistakes, and Master's-level rationale are decrypted only after the server validates the instructor code.

## Deployment note

The current repository uses a Vite frontend with an Express server. Do not describe it as Next.js.

Before production deployment to Vercel, the Express/server routing should be verified or adapted for Vercel's deployment model. The current priority is a correct, maintainable laboratory platform and high-quality module content, not production authentication infrastructure.
