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
Visual Design + Monaco Editor + Pyodide
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
- visual-design state,
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
- React Flow for visual software design
- Blockly for block-to-code activities
- `docx` for genuine Microsoft Word generation
- local browser persistence for open-access student work

The repository also contains optional Supabase/database infrastructure for future deployment work. It is not part of the current open-access Lab 01 workflow.

## Local development

Requirements:

- Node.js 20+ recommended
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

## Lab 01 academic design

Lab 01 uses a realistic **AI-assisted software release** scenario.

Students work with a supplied supervised k-nearest-neighbours defect-risk model that produces a release-risk prediction from historical software-change characteristics. Behavioral Programming is then used to keep AI recommendations separate from deterministic engineering policies such as failed-test blocking, critical-security blocking, confidence thresholds, and human review.

The core learning question is:

> How should an AI recommendation be integrated into a software workflow without allowing the AI component to violate explicit engineering requirements?

Students do not build the AI model or BP engine from scratch. They run an AI-only baseline, implement one independent `release_guardrail()` b-thread, enable it, explore multiple pull-request cases, verify the stated requirements, and interpret the difference between **AI prediction** and **software authority**.

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

## Deployment note

The current repository uses a Vite frontend with an Express server. Do not describe it as Next.js.

Before production deployment to Vercel, the Express/server routing should be verified or adapted for Vercel's deployment model. The current priority is a correct, maintainable laboratory platform and high-quality module content, not production authentication infrastructure.
