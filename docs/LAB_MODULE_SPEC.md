# AISE Lab Studio Laboratory Module Specification

**Course:** MAI5124 AI in Software Engineering  
**Module format version:** 2.1

## 1. Principle

A laboratory is an academic content package.

The platform provides the reusable reading, annotation, coding, execution, visual-design, testing, reporting, and export engines. A lecturer should normally build or revise a laboratory by editing files inside one `/labs/<lab-slug>/` folder rather than editing React application components.

The intended sequence is:

```text
theory.md
    ↓
lab-sheet.md
    ↓
Begin Lab
    ↓
starter code + optional learning tools
    ↓
public tests
    ↓
report-template.json
```

## 2. Standard directory structure

```text
/labs/
└── labXX-<descriptive-slug>/
    ├── manifest.json
    ├── theory.md
    ├── lab-sheet.md
    ├── starter/
    │   ├── main.py
    │   └── helpers.py          # only when needed
    ├── tests/
    │   └── public-tests.json
    ├── report-template.json
    ├── snippets.json
    ├── blocks.json
    ├── visual-nodes.json
    └── assets/
        ├── figures/
        └── datasets/
```

Not every laboratory needs Blockly, reusable snippets, or a visual graph. Disable features in the manifest when they do not improve the learning activity.


## 2.1 Master's-level CLO/PLO alignment rule

Every MAI5124 laboratory must make its academic purpose explicit. A student, reviewer, or quality-assurance panel should be able to see **why the activity exists**, which CLO/PLO it develops, and how that capability transfers toward the Final Project.

For this course, use the following mapping:

- **CLO1 → PLO1:** investigation and critical understanding of AI applications, concepts, issues, and limitations in software-engineering domains.
- **CLO2 → PLO2:** selection, justification, and application of appropriate AI methods/tools or AI-integration approaches for software systems.
- **CLO3 → PLO7:** interpretation of quantitative evidence and metrics to determine the performance of AI-powered software. This should be developed progressively and assessed substantively in the Final Project.

Do **not** force every lab to claim all three CLOs/PLOs. State the contribution honestly as:

- `primary`,
- `secondary`, or
- `preparatory`.

A Master's-level practical must go beyond execution. Each lab should contain at least one activity requiring students to **compare, select, justify, evaluate, interpret, or critique** an AI/SE approach. Coding may be used as evidence or experimentation, but programming syntax alone is not the learning outcome.

Each lab sheet must therefore include:

1. an explicit **Course alignment** section,
2. at least one **engineering/AI decision** before or during implementation,
3. criteria by which the student must justify that decision,
4. executable or quantitative evidence,
5. critical interpretation of the result,
6. a short **Final Project transfer** element where appropriate.

Authenticity also matters. Prefer realistic software-engineering artefacts and workflows such as pull requests, requirements, code-review findings, defect data, tests, CI results, issue reports, release decisions, debugging traces, or software-maintenance records. Avoid toy scenarios unless the abstraction itself is the intended learning object.

Optional platform features such as React Flow, Blockly, snippets, or visual designers must only be enabled when their use is directly tied to a learning outcome. Do not add them for decoration.

## 3. `manifest.json`

The manifest contains module metadata and enabled capabilities. It should not contain long theory text or starter source code.

Example:

```json
{
  "id": "lab01-behavioral-programming",
  "labNumber": 1,
  "week": 1,
  "title": "AI for Software Design: Behavioral Programming",
  "shortDescription": "Model independent software requirements as b-threads and verify a safety invariant.",
  "estimatedDuration": "3 hours",
  "language": "python",
  "runner": "pyodide",
  "packages": [],
  "features": {
    "visualDesigner": true,
    "blockly": true,
    "functionPalette": true,
    "testRunner": true,
    "reportEditor": true,
    "webPreview": false
  },
  "learningOutcomes": [
    "Investigate an AI application in a software-engineering workflow.",
    "Compare and justify alternative AI-integration approaches.",
    "Verify and interpret the behavior of the selected approach."
  ],
  "courseAlignment": [
    {
      "clo": "CLO1",
      "plo": "PLO1",
      "contribution": "primary",
      "evidence": "Investigate the AI application and its limitations."
    },
    {
      "clo": "CLO2",
      "plo": "PLO2",
      "contribution": "secondary",
      "evidence": "Compare, justify, and apply an appropriate method."
    }
  ],
  "tasks": [
    {
      "id": "l1-t1",
      "title": "Understand the coordinator",
      "description": "Trace event selection and b-thread synchronization.",
      "category": "code"
    }
  ]
}
```

### Required metadata

- `id`: stable slug used by routes and persistence.
- `labNumber`: displayed module number.
- `week`: teaching week.
- `title`: academic laboratory title.
- `shortDescription`: one or two sentences for the module list.
- `estimatedDuration`: realistic student working time.
- `language`: primary editor language.
- `runner`: execution engine.
- `packages`: approved Pyodide packages if required.
- `features`: turn optional workspace engines on/off.
- `learningOutcomes`: outcomes specific to this practical.
- `courseAlignment`: explicit CLO/PLO contribution, level, and evidence.
- `tasks`: high-level completion structure.

## 4. `theory.md`

This is the pre-lab conceptual reading.

It should explain enough theory for the student to understand *why* the practical exists, not merely repeat the task instructions.

Recommended structure:

1. Why the topic matters in software engineering.
2. Core concepts and terminology.
3. Formal or algorithmic model where appropriate.
4. Small worked example.
5. Design limitations and assumptions.
6. Questions students should be able to answer before coding.

Keep terminology technically precise. Do not label a method as AI, machine learning, an agent, or a digital twin unless the activity actually meets that definition.

The current article renderer supports common Markdown headings, paragraphs, lists, blockquotes, fenced code, bold/italic text, and inline code. Prefer renderer-friendly notation for mathematical expressions unless equation rendering is added to the platform.

## 5. `lab-sheet.md`

This contains the practical activity.

Recommended structure:

- scenario,
- objective,
- provided files/data,
- configuration,
- numbered implementation tasks,
- verification requirements,
- visual-design activity where relevant,
- controlled experiment or extension,
- report requirements,
- critical-analysis questions,
- completion checklist.

A Master's-level lab should not collapse into "copy this code and run it." At least one task must require a defensible method/architecture/tool decision using stated criteria, followed by verification or interpretation of evidence.

## 6. Starter code

Starter code must provide enough scaffolding to focus the student on the learning outcome without giving away the solution.

Good starter code may include:

- constants,
- imports,
- helper functions,
- one worked example,
- TODO functions,
- instrumentation,
- data loading,
- display utilities.

Avoid shipping the full required solution and then asking students to reproduce it.

If a full instructor solution is required, keep it outside the public student repository or in an access-controlled instructor location. Hiding a solution in client-side application code is not secure.

## 7. `tests/public-tests.json`

Public tests are formative executable checks.

Each test has:

```json
{
  "id": "test-name",
  "name": "Readable test name",
  "description": "What behavior is being verified.",
  "testCode": "Python assertion code",
  "weight": 20
}
```

### Test design rules

Prefer semantic tests over structural tests.

Weak:

```python
assert "block" in spec
```

Stronger:

```python
for event in trace:
    update_state(event)
    assert volume <= MAX_CAPACITY
```

A student should not pass a safety requirement merely because a variable, field, or function name exists.

Tests should cover:

- required functional behavior,
- edge conditions,
- deterministic behavior when required,
- stated invariants,
- integration across relevant components.

Weights across tests should normally sum to 100.

## 8. `report-template.json`

The report template defines the integrated student report.

Example:

```json
{
  "title": "Lab 01 Report",
  "sections": [
    {
      "id": "concepts",
      "title": "1. Concepts",
      "required": true,
      "placeholder": "Explain the key model in your own words."
    },
    {
      "id": "results",
      "title": "2. Results and Verification Evidence",
      "required": true,
      "placeholder": "Insert output, figures, tests, and interpretation."
    },
    {
      "id": "critical-analysis",
      "title": "3. Critical Analysis",
      "required": true,
      "placeholder": "Answer the laboratory analysis questions."
    }
  ]
}
```

Students enter their name and student ID in the report workspace. The platform does not require a student login in open-access mode.

The report should require interpretation, not only screenshots.

## 9. `snippets.json`

Snippets are optional learning aids that students can insert into Monaco.

Use snippets for:

- generic API patterns,
- repetitive boilerplate,
- syntax templates,
- instrumentation.

Do not include a snippet that effectively reveals the entire assessed solution.

## 10. `blocks.json`

Blockly is optional. Use it when representing a computational relationship visually helps students understand the concept.

The preferred direction is:

```text
blocks → generated code → Monaco
```

Do not promise reliable arbitrary code → Blockly reconstruction.

## 11. `visual-nodes.json`

React Flow is used for software structures, pipelines, agents, components, or interactions.

The initial graph may provide:

- a partial design that students complete,
- a reference architecture they must inspect and modify,
- node types required by the task.

The visual activity should correspond to a learning outcome. Do not add a diagram merely for decoration.

## 12. Registration

The current Vite build imports module assets through `labs/registry.ts`.

For Lab 01, the registry imports:

- `manifest.json`,
- `theory.md?raw`,
- `lab-sheet.md?raw`,
- starter source files with `?raw`,
- JSON tests/snippets/blocks/visual nodes/report template.

The registry should compose those assets into `LabManifest`. Do not duplicate the full contents of the files as TypeScript template strings.

Future work may automate folder discovery, but explicit imports are acceptable while there are only eleven fixed course modules.

## 13. Open-access persistence

In the current open-access student mode, there is no user account.

Each browser stores its own:

- source files,
- visual design,
- report draft,
- test statistics,
- checkpoints,
- local submission snapshot,
- reading annotations.

This prevents all anonymous students from writing into the same synthetic server-side user record.

Students must be told that clearing browser data or moving to another computer does not transfer this local state. Word/PDF exports are the durable copy until a later central submission mechanism is introduced.

## 14. Quality gate before unlocking a module

Do not unlock a lab simply because the page renders.

Before release, verify:

1. Theory is technically correct.
2. The lab sheet states the intended CLO/PLO contribution explicitly.
3. The claimed CLO/PLO level is defensible as primary, secondary, or preparatory.
4. The activity is appropriate for Master's level and includes a genuine compare/select/justify/evaluate/interpret task.
5. The scenario uses a realistic AI/software-engineering problem or artefact unless abstraction is itself the learning objective.
6. Students must make and justify at least one engineering/AI decision rather than only follow a prescribed recipe.
7. Starter code does not contain the complete answer.
8. Starter code actually runs up to the intentional TODO point.
9. The final intended solution can run in Pyodide.
10. Public tests fail meaningfully on incomplete work.
11. Public tests pass on a correct implementation.
12. Tests verify behavior, not superficial syntax.
13. Quantitative metrics are interpreted when CLO3/PLO7 is targeted, not merely displayed.
14. Optional visual/block tools are enabled only when they contribute directly to a learning outcome.
15. Report sections capture decision rationale, evidence, interpretation, and Final Project transfer where appropriate.
16. Word report export works.
17. Theory/lab-sheet Word and PDF export work.
18. Annotation tools persist correctly.
19. No instructor solution is shipped to the public browser bundle.
20. The module is readable and usable on a normal laptop screen.

Only then change the course release configuration so the module becomes available.

## 15. Recommended GitHub workflow

Develop one lab at a time:

```text
main
  └── module-01-cleanup
      └── review / test
          └── merge
              └── module-02-development
```

Keep platform-engine changes separate from ordinary academic-content edits whenever practical. This makes it easier to review whether a change affects only one module or the whole teaching environment.
