# AISE Lab Studio Laboratory Module Specification

**Course:** MAI5124 AI in Software Engineering  
**Standard Version:** 1.0.0  
**Target Environment:** AISE Lab Studio (Standalone Node.js / Next.js / Vercel Architecture)

---

## 1. Overview

AISE Lab Studio is architected with a decoupled laboratory design. The platform infrastructure (authentication, editor, runners, test framework, report engine, DOCX generator) is completely independent of specific laboratory domain contents.

Each laboratory resides in its own isolated directory within `/labs/<lab-slug>/`. Laboratories are loaded via the `LabRegistry` abstraction. To add or modify a laboratory, an instructor or curriculum engineer only needs to push a new folder to GitHub matching this specification.

---

## 2. Directory Structure

```
/labs/
└── labXX-<descriptive-slug>/
    ├── manifest.json            # Lab metadata, packages, enabled features
    ├── instructions.md          # Pedagogical instructions in Markdown
    ├── report-template.json     # Academic report structure for the lab
    ├── starter/                 # Initial code files loaded into student workspace
    │   ├── main.py
    │   ├── helpers.py
    │   └── README.md
    ├── snippets.json            # Function palette items for drag-and-drop / insert
    ├── blocks.json              # Custom Blockly blocks (if visual coding enabled)
    ├── visual-nodes.json        # Pre-configured React Flow nodes and edges
    ├── tests/
    │   └── public-tests.json    # Automated test cases run in the workspace
    └── assets/                  # Lab-specific reference diagrams or datasets
```

---

## 3. File Specifications

### 3.1 `manifest.json`

The entry configuration file for the lab.

```json
{
  "id": "lab01-behavioral-programming",
  "labNumber": 1,
  "week": 1,
  "title": "AI for Software Design: Behavioral Programming",
  "shortDescription": "Explore behavioral programming principles using b-threads, priority coordination, and AI-assisted behavioral conflict detection.",
  "estimatedDuration": "3 hours",
  "language": "python",
  "runner": "pyodide",
  "packages": ["numpy", "matplotlib"],
  "features": {
    "visualDesigner": true,
    "blockly": true,
    "functionPalette": true,
    "testRunner": true,
    "reportEditor": true,
    "webPreview": false
  },
  "learningOutcomes": [
    "Formulate software behaviors using independent b-threads.",
    "Implement request, wait-for, and block idioms.",
    "Verify behavioral synchronization using automated assertions."
  ],
  "defaultFiles": [
    { "name": "main.py", "language": "python", "path": "starter/main.py" },
    { "name": "helpers.py", "language": "python", "path": "starter/helpers.py" }
  ]
}
```

### 3.2 `instructions.md`

Written in standard Markdown. Must follow academic rigor and include:
1. **Overview & Context**
2. **Learning Outcomes**
3. **Background & Theoretical Foundation**
4. **Step-by-Step Required Tasks**
5. **Guidance and Common Pitfalls**
6. **Deliverables and Completion Checklist**

### 3.3 `report-template.json`

Defines the structure of the student laboratory report. The TipTap / rich-text report engine dynamically provisions these sections for the student, and the Word (`.docx`) exporter formats them according to university standards.

```json
{
  "title": "Lab 01 Technical Report",
  "sections": [
    { "id": "objective", "title": "1. Laboratory Objectives", "required": true, "placeholder": "Describe the key objectives..." },
    { "id": "methodology", "title": "2. Theoretical Methodology", "required": true },
    { "id": "implementation", "title": "3. Implementation & B-Thread Design", "required": true },
    { "id": "results", "title": "4. Execution Results & Empirical Evidence", "required": true },
    { "id": "discussion", "title": "5. Critical Analysis & Answers to Questions", "required": true },
    { "id": "conclusion", "title": "6. Conclusion & Future Refinements", "required": true }
  ]
}
```

### 3.4 `snippets.json`

Populates the reusable component palette. Students can click **"Insert"** or drag snippets into the Monaco editor.

```json
[
  {
    "id": "bthread-template",
    "category": "Behavioral Programming",
    "name": "B-Thread Generator",
    "description": "Yields request, wait-for, and block event specifications.",
    "parameters": ["event_requested", "event_blocked"],
    "code": "def b_thread_controller():\n    # Request an event while blocking alternatives\n    yield {'request': 'MOVE_FORWARD', 'block': ['TURN_LEFT']}\n"
  }
]
```

### 3.5 `tests/public-tests.json`

Defines client-verifiable test cases executed against the student's code.

```json
[
  {
    "id": "test-sync",
    "name": "Behavioral Synchronization Check",
    "description": "Verifies that blocked events are never dispatched by the b-program sync coordinator.",
    "testCode": "def test_sync():\n    bp = BProgram()\n    # Assert invariants\n    assert bp.evaluate_conflict() == True\ntest_sync()",
    "weight": 25
  }
]
```

---

## 4. Modularity and GitHub Lifecycle

1. To add a new laboratory (e.g., `lab12-neuromorphic-testing`):
   - Duplicate the laboratory template folder.
   - Populate `manifest.json`, `instructions.md`, `report-template.json`, starter files, and test definitions.
   - Register the folder ID in `/labs/registry.ts`.
2. Commit and push to GitHub.
3. Vercel automatically redeploys. The lab becomes instantly available to lecturers for activation and scheduling.
