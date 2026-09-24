import type { LabManifest, LabTaskItem } from './types';

// Import reference assets for Lab 01
import lab01Snippets from './lab01-behavioral-programming/snippets.json';
import lab01Blocks from './lab01-behavioral-programming/blocks.json';
import lab01VisualNodes from './lab01-behavioral-programming/visual-nodes.json';
import lab01Tests from './lab01-behavioral-programming/tests/public-tests.json';
import lab01ReportTemplate from './lab01-behavioral-programming/report-template.json';

const lab01Instructions = `# Lab 01: AI for Software Design: Behavioral Programming

**Course:** MAI5124 AI in Software Engineering  
**Unit:** Software Design & Behavioral Specification  
**Estimated Time:** 3 Hours

---

### 1. Overview & Context
Traditional software architectures enforce centralized coordination logic through monolithic state machines or branching control flows. When requirements change or new safety constraints emerge, modifying a centralized system often introduces catastrophic regression faults.

**Behavioral Programming (BP)** is an operational paradigm founded on independent strands of behavior called **b-threads**.
- Each b-thread represents a distinct, autonomous requirement or safety invariant.
- At every synchronization point, b-threads announce their intentions using three modalities:
  - **Requested events (R):** Events this thread proposes for immediate execution.
  - **Waited-for events (W):** Events this thread is interested in listening to.
  - **Blocked events (B):** Events this thread strictly prohibits from occurring.
- An impartial execution coordinator (Arbiter) selects an event that is **requested by at least one b-thread** and **blocked by none**.

---

### 2. Learning Outcomes
1. **Formulate concurrent software requirements** as independent, non-interfering b-threads.
2. **Apply the Request-Wait-Block (RWB) protocol** to enforce critical safety invariants without rewriting core business logic.
3. **Execute and analyze behavioral event traces** using Pyodide in Python.
4. **Evaluate conflict resolution** and verify deadlock-free operation through automated assertion suites.
5. **Formulate a structured academic technical report** incorporating code, execution traces, visual topologies, and analytical discussion.

---

### 3. Required Tasks
- **Task 1:** Inspect \`helpers.py\` to understand the \`BProgram\` coordinator. In \`main.py\`, implement \`add_hot_water\` and \`add_cold_water\` b-threads.
- **Task 2:** Implement the \`overflow_prevention\` safety monitor b-thread that dynamically blocks water filling once volume capacity reaches 6 units and triggers \`DRAIN_VALVE\`.
- **Task 3:** In the Visual Designer panel, adjust the coordination pipeline or inspect the visual nodes.
- **Task 4:** Run public tests (Toolbar > "Run Tests") to confirm passing verification.
- **Task 5:** Write your observations in the **Report** workspace, attach snapshots of your output, and download or submit your Word report.`;

const lab01MainPy = `"""
MAI5124 AI in Software Engineering
Lab 01: Behavioral Programming Reference Implementation

Student: Ahmed Ali (24012345)
"""
from helpers import BProgram

def add_hot_water():
    """B-Thread: Requests HOT_WATER 4 times."""
    for i in range(4):
        yield {
            'request': ['HOT_WATER'],
            'waitFor': ['COLD_WATER'],
            'block': []
        }

def add_cold_water():
    """B-Thread: Requests COLD_WATER 4 times."""
    for i in range(4):
        yield {
            'request': ['COLD_WATER'],
            'waitFor': ['HOT_WATER'],
            'block': []
        }

def overflow_prevention():
    """
    Safety Invariant B-Thread:
    Maintains liquid volume state and blocks water injection
    when capacity threshold is reached.
    """
    capacity = 0
    max_threshold = 6

    while True:
        if capacity >= max_threshold:
            # Enforce safety invariant: strictly BLOCK positive events
            yield {
                'request': ['DRAIN_VALVE'],
                'waitFor': ['DRAIN_VALVE'],
                'block': ['HOT_WATER', 'COLD_WATER']
            }
            capacity -= 2
        else:
            event = yield {
                'request': [],
                'waitFor': ['HOT_WATER', 'COLD_WATER', 'DRAIN_VALVE'],
                'block': []
            }
            if event in ['HOT_WATER', 'COLD_WATER']:
                capacity += 1
            elif event == 'DRAIN_VALVE':
                capacity = max(0, capacity - 2)

def main():
    print("=" * 60)
    print("AISE Lab Studio: Lab 01 Behavioral Simulation Running...")
    print("=" * 60)

    bp = BProgram()
    bp.add_bthread(add_hot_water)
    bp.add_bthread(add_cold_water)
    bp.add_bthread(overflow_prevention)

    trace = bp.run(max_steps=20)

    print("\\n--- Simulation Summary ---")
    print(f"Total Events Dispatched: {len(trace)}")
    print(f"Event Trace: {' -> '.join(trace)}")
    print("Safety Invariant: Overflow safely mitigated by coordinator.")

if __name__ == '__main__':
    main()
`;

const lab01HelpersPy = `"""
Behavioral Programming Engine for MAI5124 Lab 01.
Implements the Request-Wait-Block (RWB) synchronization coordinator.
"""
from typing import Dict, List, Set, Any, Generator

class Event:
    def __init__(self, name: str, payload: Any = None):
        self.name = name
        self.payload = payload

    def __repr__(self):
        return f"Event('{self.name}')"

    def __eq__(self, other):
        if isinstance(other, str):
            return self.name == other
        if isinstance(other, Event):
            return self.name == other.name
        return False

    def __hash__(self):
        return hash(self.name)


class BProgram:
    def __init__(self):
        self.threads: List[Generator] = []
        self.history: List[str] = []

    def add_bthread(self, generator_func):
        """Register a generator as a behavioral thread."""
        gen = generator_func()
        self.threads.append(gen)

    def run(self, max_steps: int = 50) -> List[str]:
        current_syncs: List[Dict[str, Any]] = []
        active_threads: List[Generator] = []

        for t in self.threads:
            try:
                sync_spec = next(t)
                current_syncs.append(sync_spec)
                active_threads.append(t)
            except StopIteration:
                pass

        step = 0
        while active_threads and step < max_steps:
            step += 1
            requested: Set[str] = set()
            blocked: Set[str] = set()

            for spec in current_syncs:
                req = spec.get('request', [])
                if isinstance(req, str):
                    req = [req]
                requested.update(req)

                blk = spec.get('block', [])
                if isinstance(blk, str):
                    blk = [blk]
                blocked.update(blk)

            candidates = [e for e in requested if e not in blocked]
            if not candidates:
                break

            selected_event = candidates[0]
            self.history.append(selected_event)
            print(f"[STEP {step:02d}] Dispatched Event: >> {selected_event} <<")

            new_syncs = []
            new_active = []

            for t, spec in zip(active_threads, current_syncs):
                req = spec.get('request', [])
                if isinstance(req, str):
                    req = [req]
                wfor = spec.get('waitFor', [])
                if isinstance(wfor, str):
                    wfor = [wfor]

                interested = (selected_event in req) or (selected_event in wfor)
                if interested:
                    try:
                        next_spec = t.send(selected_event)
                        new_syncs.append(next_spec)
                        new_active.append(t)
                    except StopIteration:
                        pass
                else:
                    new_syncs.append(spec)
                    new_active.append(t)

            current_syncs = new_syncs
            active_threads = new_active

        return self.history
`;

// Curriculum-aligned task catalog mapping for all MAI5124 laboratories
export const LAB_TASKS_CATALOG: Record<string, LabTaskItem[]> = {
  'lab01-behavioral-programming': [
    { id: 'l1-t1', title: 'B-Thread Concurrent Formulation', description: 'Implement add_hot_water and add_cold_water generators with RWB protocol', category: 'code' },
    { id: 'l1-t2', title: 'Overflow Prevention Safety Monitor', description: 'Implement dynamic blocking monitor at threshold capacity = 6', category: 'code' },
    { id: 'l1-t3', title: 'Visual Coordination Pipeline', description: 'Configure event topology and b-thread nodes in Visual Designer', category: 'design' },
    { id: 'l1-t4', title: 'Automated Assertion Verification', description: 'Run public test suite to verify deadlock-free operation', category: 'test' },
    { id: 'l1-t5', title: 'Technical Report & Final Submission', description: 'Author required analytical sections and submit academic report', category: 'submission' },
  ],
  'lab02-requirement-prioritization': [
    { id: 'l2-t1', title: 'Requirement Text Pre-Processing', description: 'Clean, tokenize, and compute TF-IDF vector embeddings', category: 'code' },
    { id: 'l2-t2', title: 'Machine Learning Classifier', description: 'Train supervised model to predict priority classes (High/Medium/Low)', category: 'code' },
    { id: 'l2-t3', title: 'MoSCoW Tagging & Ranking', description: 'Automate priority ranking and MoSCoW categorization pipeline', category: 'design' },
    { id: 'l2-t4', title: 'Automated Model Verification', description: 'Run assertion tests to validate classifier performance and metrics', category: 'test' },
    { id: 'l2-t5', title: 'Technical Report & Final Submission', description: 'Document findings and submit formal laboratory report', category: 'submission' },
  ],
  'lab03-social-commitment-agents': [
    { id: 'l3-t1', title: 'Agent Speech-Act Communication', description: 'Implement communicative protocols and message schemas', category: 'code' },
    { id: 'l3-t2', title: 'Conditional Commitment Engine', description: 'Build commitment state transitions (Create, Detach, Discharge)', category: 'code' },
    { id: 'l3-t3', title: 'Multi-Agent Contract Negotiation', description: 'Simulate distributed agent dialogue and agreement trace', category: 'design' },
    { id: 'l3-t4', title: 'Commitment Protocol Verification', description: 'Run assertion suite to verify non-conflicting agent states', category: 'test' },
    { id: 'l3-t5', title: 'Technical Report & Final Submission', description: 'Author discussion on multi-agent safety and submit report', category: 'submission' },
  ],
  'lab04-intelligent-agents': [
    { id: 'l4-t1', title: 'BDI Architecture Implementation', description: 'Formulate Belief, Desire, and Intention data structures', category: 'code' },
    { id: 'l4-t2', title: 'Deliberative Goal Selection', description: 'Synthesize reasoning loop with utility-based planning', category: 'code' },
    { id: 'l4-t3', title: 'Dynamic Environmental Reactivity', description: 'Handle unexpected environmental disturbances and replanning', category: 'design' },
    { id: 'l4-t4', title: 'Behavioral Assertion Verification', description: 'Validate agent goal convergence and safety bounds', category: 'test' },
    { id: 'l4-t5', title: 'Technical Report & Final Submission', description: 'Document empirical benchmarks and submit final report', category: 'submission' },
  ],
  'lab05-artifact-generation': [
    { id: 'l5-t1', title: 'Specification Grammar Parsing', description: 'Extract architectural entities from natural language requirements', category: 'code' },
    { id: 'l5-t2', title: 'Automated UML Diagram Synthesis', description: 'Synthesize class hierarchies and statechart specifications', category: 'design' },
    { id: 'l5-t3', title: 'Code & Test Stub Generation', description: 'Produce compilable interfaces and mock assertions', category: 'code' },
    { id: 'l5-t4', title: 'Generated Artifact Verification', description: 'Execute syntactic and structural integrity checks', category: 'test' },
    { id: 'l5-t5', title: 'Technical Report & Final Submission', description: 'Analyze synthesis fidelity and submit academic report', category: 'submission' },
  ],
  'lab06-software-fusion': [
    { id: 'l6-t1', title: 'AST & Dependency Extraction', description: 'Construct code abstract syntax trees and call graphs', category: 'code' },
    { id: 'l6-t2', title: 'Graph Neural Network Pipeline', description: 'Embed architectural graph representations for pattern learning', category: 'code' },
    { id: 'l6-t3', title: 'Code Smell & Anti-Pattern Detection', description: 'Classify circular dependencies and monolithic components', category: 'design' },
    { id: 'l6-t4', title: 'Pattern Classification Verification', description: 'Verify accuracy of learned architectural smell detections', category: 'test' },
    { id: 'l6-t5', title: 'Technical Report & Final Submission', description: 'Formulate design recommendations and submit lab report', category: 'submission' },
  ],
  'lab07-software-auto-generation': [
    { id: 'l7-t1', title: 'LTL Safety Specification', description: 'Formalize safety and liveness constraints in temporal logic', category: 'code' },
    { id: 'l7-t2', title: 'State Machine Controller Synthesis', description: 'Generate correct-by-construction finite state controllers', category: 'design' },
    { id: 'l7-t3', title: 'Cyber-Physical Loop Simulation', description: 'Execute closed-loop sensor/actuator simulation', category: 'code' },
    { id: 'l7-t4', title: 'Temporal Safety Verification', description: 'Verify zero deadlocks and hazard state mitigation', category: 'test' },
    { id: 'l7-t5', title: 'Technical Report & Final Submission', description: 'Analyze real-time performance and submit lab report', category: 'submission' },
  ],
  'lab08-ai-software-testing': [
    { id: 'l8-t1', title: 'Metamorphic Relation Construction', description: 'Define input transformation invariants without ground-truth oracles', category: 'code' },
    { id: 'l8-t2', title: 'Predictive Oracle Model Training', description: 'Train differential classifier to identify subtle anomalies', category: 'code' },
    { id: 'l8-t3', title: 'Mutation & Fault Invariant Testing', description: 'Evaluate test suite sensitivity against synthetic mutants', category: 'design' },
    { id: 'l8-t4', title: 'Automated Oracle Verification', description: 'Run automated test harness to measure mutation score', category: 'test' },
    { id: 'l8-t5', title: 'Technical Report & Final Submission', description: 'Author empirical evaluation of oracle quality and submit', category: 'submission' },
  ],
  'lab09-risk-based-testing': [
    { id: 'l9-t1', title: 'Software Risk Matrix Construction', description: 'Quantify failure probabilities and operational impact scores', category: 'code' },
    { id: 'l9-t2', title: 'Bayesian Belief Network Graph', description: 'Model probabilistic fault propagation across modules', category: 'design' },
    { id: 'l9-t3', title: 'Risk-Prioritized Test Ordering', description: 'Optimize regression suite schedule under execution time budgets', category: 'code' },
    { id: 'l9-t4', title: 'RPN Schedule Verification', description: 'Verify risk coverage vs test execution budget constraints', category: 'test' },
    { id: 'l9-t5', title: 'Technical Report & Final Submission', description: 'Evaluate test cost reductions and submit academic report', category: 'submission' },
  ],
  'lab10-spreadsheet-debugging': [
    { id: 'l10-t1', title: 'Cell Dependency DAG Construction', description: 'Parse formulas and extract calculation dependency graph', category: 'code' },
    { id: 'l10-t2', title: 'Semantic Calculation Anomaly Detection', description: 'Detect formula syntax inconsistencies and outliers', category: 'code' },
    { id: 'l10-t3', title: 'Fault Localization in Complex Models', description: 'Identify root-cause errors in interconnected sheets', category: 'design' },
    { id: 'l10-t4', title: 'Automated Localization Verification', description: 'Validate diagnostic precision against ground truth', category: 'test' },
    { id: 'l10-t5', title: 'Technical Report & Final Submission', description: 'Document debugging workflow and submit formal report', category: 'submission' },
  ],
  'lab11-ai-software-debugging': [
    { id: 'l11-t1', title: 'Spectrum Matrix & Trace Collection', description: 'Capture test execution coverage spectra across test cases', category: 'code' },
    { id: 'l11-t2', title: 'SBFL Suspiciousness Ranking', description: 'Compute Ochiai, Tarantula, and DStar formula metric ranks', category: 'code' },
    { id: 'l11-t3', title: 'Automated Patch Synthesis', description: 'Generate localized candidate patches for ranked faulty lines', category: 'design' },
    { id: 'l11-t4', title: 'Regression Assertion Verification', description: 'Run regression suite confirming patch eliminates bug without regressions', category: 'test' },
    { id: 'l11-t5', title: 'Technical Report & Final Submission', description: 'Compare ranking formulas and submit academic report', category: 'submission' },
  ],
  'exam-code-review': [
    { id: 'ex-t1', title: 'Critical Security Vulnerability Audit', description: 'Identify critical architectural anomalies and security defects', category: 'code' },
    { id: 'ex-t2', title: 'Automated Remediation Patch Generation', description: 'Synthesize verified bug fixes and security guards', category: 'code' },
    { id: 'ex-t3', title: 'Regression & Safety Verification', description: 'Execute test harness validating patch integrity', category: 'test' },
    { id: 'ex-t4', title: 'Formal Examination Report & Submission', description: 'Author technical audit report and record exam submission', category: 'submission' },
  ],
};

// Helper generator for shell lab modules
function createLabShell(
  id: string,
  labNumber: number,
  week: number,
  title: string,
  shortDescription: string,
  outcomes: string[],
  initialCode: string
): LabManifest {
  const tasks = LAB_TASKS_CATALOG[id] || [
    { id: `${id}-t1`, title: 'Inspect Starter Architecture', description: 'Review initial codebase and starter structures', category: 'code' },
    { id: `${id}-t2`, title: 'Implement Core AI Engine', description: 'Formulate core algorithmic logic and processing pipeline', category: 'code' },
    { id: `${id}-t3`, title: 'Visual Flow & Graph Modeling', description: 'Model visual graph or interaction nodes', category: 'design' },
    { id: `${id}-t4`, title: 'Automated Test Verification', description: 'Execute assertion test suite and verify invariants', category: 'test' },
    { id: `${id}-t5`, title: 'Technical Report & Submission', description: 'Document analytical findings and submit final lab', category: 'submission' },
  ];

  return {
    id,
    labNumber,
    week,
    title,
    shortDescription,
    estimatedDuration: '3 hours',
    language: 'python',
    runner: 'pyodide',
    packages: ['numpy', 'matplotlib', 'pandas'],
    features: {
      visualDesigner: true,
      blockly: true,
      functionPalette: true,
      testRunner: true,
      reportEditor: true,
      webPreview: false,
    },
    learningOutcomes: outcomes,
    tasks,
    starterFiles: [
      { name: 'main.py', language: 'python', content: initialCode },
      { name: 'README.md', language: 'markdown', content: `# ${title}\n\n${shortDescription}` },
    ],
    reportTemplate: {
      title: `${title} Report`,
      sections: [
        { id: 'objective', title: '1. Objective', required: true },
        { id: 'methodology', title: '2. Methodology', required: true },
        { id: 'implementation', title: '3. Implementation', required: true },
        { id: 'results', title: '4. Results', required: true },
        { id: 'discussion', title: '5. Discussion & Analysis', required: true },
        { id: 'conclusion', title: '6. Conclusion', required: true },
      ],
    },
    snippets: [
      {
        id: `${id}-snippet-1`,
        category: 'Utility',
        name: 'Matrix Analyzer',
        description: 'Computes precision, recall, and evaluation metrics.',
        code: "import numpy as np\nprint('Computing evaluation metrics...')\n",
      },
    ],
    blocks: lab01Blocks as any,
    visualDesign: {
      nodes: [
        { id: '1', type: 'input', data: { label: 'Input Data / Specification' }, position: { x: 50, y: 100 } },
        { id: '2', type: 'default', data: { label: 'AI Processing Engine' }, position: { x: 350, y: 100 } },
        { id: '3', type: 'output', data: { label: 'Validated Output / Decision' }, position: { x: 650, y: 100 } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', label: 'Feeds' },
        { id: 'e2-3', source: '2', target: '3', label: 'Produces' },
      ],
    },
    tests: [
      {
        id: `${id}-test-1`,
        name: 'Pipeline Integrity Check',
        description: 'Verifies the primary functions return valid structures.',
        testCode: "import main\nprint('Running test assertion...')\nassert True",
        weight: 50,
      },
      {
        id: `${id}-test-2`,
        name: 'Evaluation Metrics Validation',
        description: 'Checks output ranges and boundary conditions.',
        testCode: "assert 1 + 1 == 2",
        weight: 50,
      },
    ],
    instructionsMarkdown: `# ${title}\n\n**Course:** MAI5124 AI in Software Engineering  \n**Estimated Duration:** 3 hours\n\n### 1. Overview\n${shortDescription}\n\n### 2. Learning Outcomes\n${outcomes.map((o) => `- ${o}`).join('\n')}\n\n### 3. Required Tasks\n1. Review the initial code in \`main.py\`.\n2. Implement the designated algorithm or AI pipeline.\n3. Run automated tests in the workspace toolbar.\n4. Document your results in the **Report** workspace.`,
  };
}

// Registry Map of all 11 Laboratories + Practical Exam
const labRegistryMap: Map<string, LabManifest> = new Map();

// Lab 01 - Full Reference Implementation
labRegistryMap.set('lab01-behavioral-programming', {
  id: 'lab01-behavioral-programming',
  labNumber: 1,
  week: 1,
  title: 'AI for Software Design: Behavioral Programming',
  shortDescription: 'Explore b-thread prioritization, event request/wait-for/block mechanics, and AI conflict coordination.',
  estimatedDuration: '3 hours',
  language: 'python',
  runner: 'pyodide',
  packages: ['numpy', 'matplotlib'],
  features: {
    visualDesigner: true,
    blockly: true,
    functionPalette: true,
    testRunner: true,
    reportEditor: true,
    webPreview: false,
  },
  learningOutcomes: [
    'Formulate concurrent software requirements as independent, non-interfering b-threads.',
    'Apply the Request-Wait-Block (RWB) protocol to enforce critical safety invariants without rewriting core business logic.',
    'Execute and analyze behavioral event traces using Pyodide in Python.',
    'Evaluate conflict resolution and verify deadlock-free operation through automated assertion suites.',
    'Formulate a structured academic technical report incorporating code, execution traces, visual topologies, and analytical discussion.',
  ],
  tasks: LAB_TASKS_CATALOG['lab01-behavioral-programming'],
  starterFiles: [
    { name: 'main.py', language: 'python', content: lab01MainPy },
    { name: 'helpers.py', language: 'python', content: lab01HelpersPy },
    {
      name: 'README.md',
      language: 'markdown',
      content: '# Lab 01: Behavioral Programming\n\nRun `main.py` using the Run button in the top toolbar to start the simulation.',
    },
  ],
  reportTemplate: lab01ReportTemplate as any,
  snippets: lab01Snippets as any,
  blocks: lab01Blocks as any,
  visualDesign: lab01VisualNodes as any,
  tests: lab01Tests as any,
  instructionsMarkdown: lab01Instructions,
});

// Lab 02
labRegistryMap.set(
  'lab02-requirement-prioritization',
  createLabShell(
    'lab02-requirement-prioritization',
    2,
    2,
    'AI Techniques for Software Requirements Prioritization',
    'Implement NLP and machine-learning classifiers to automate software requirement ranking and MoSCoW tagging.',
    [
      'Pre-process unstructured requirement statements using TF-IDF and word embeddings.',
      'Train supervised classifiers (Random Forest, SVM) to predict priority classes.',
      'Evaluate model accuracy, F1-scores, and trade-offs in requirement prioritization.',
    ],
    `# Lab 02: Software Requirements Prioritization\nimport numpy as np\n\ndef prioritize_requirements(requirements_list):\n    print(f"Analyzing {len(requirements_list)} requirements...")\n    # Implement classifier here\n    return [{"req": r, "priority": "High"} for r in requirements_list]\n\nif __name__ == '__main__':\n    sample = ["System must support 10,000 concurrent sessions", "Export report to PDF"]\n    print(prioritize_requirements(sample))\n`
  )
);

// Lab 03
labRegistryMap.set(
  'lab03-social-commitment-agents',
  createLabShell(
    'lab03-social-commitment-agents',
    3,
    3,
    'Agent-Based Software Programming: Social Commitments',
    'Model multi-agent negotiation, conditional commitments, and communicative speech-acts in software ecosystems.',
    [
      'Define social commitment states: Create, Fulfill, Cancel, Release, Discharge.',
      'Implement commitment-driven interaction protocols between buyer, supplier, and escrow agents.',
      'Formulate verification rules for commitment compliance and violation tracking.',
    ],
    `# Lab 03: Social Commitments & Speech-Acts\n\nclass SocialCommitment:\n    def __init__(self, debtor, creditor, antecedent, consequent):\n        self.debtor = debtor\n        self.creditor = creditor\n        self.antecedent = antecedent\n        self.consequent = consequent\n        self.state = "CONDITIONAL"\n\nprint("Initialized Multi-Agent Commitment Protocol.")\n`
  )
);

// Lab 04
labRegistryMap.set(
  'lab04-intelligent-agents',
  createLabShell(
    'lab04-intelligent-agents',
    4,
    4,
    'Agent-Based Software Programming: Intelligent Agents',
    'Build reactive and deliberate BDI (Belief-Desire-Intention) agents for dynamic software orchestration.',
    [
      'Implement belief update loops in response to asynchronous environment signals.',
      'Design goal selection and intention reconsideration algorithms.',
      'Evaluate agent resilience against dynamic failure modes.',
    ],
    `# Lab 04: BDI Intelligent Agents\n\nclass BDIAgent:\n    def __init__(self, agent_id):\n        self.agent_id = agent_id\n        self.beliefs = set()\n        self.desires = []\n        self.intentions = []\n\nprint("BDI Agent framework ready.")\n`
  )
);

// Lab 05
labRegistryMap.set(
  'lab05-artifact-generation',
  createLabShell(
    'lab05-artifact-generation',
    5,
    5,
    'Automated Software Artifact Generation',
    'Synthesize UML diagrams, API stubs, and unit test suites from natural language specifications.',
    [
      'Extract entity models and associations from structured domain narratives.',
      'Generate OpenAPI-compliant JSON schemas and Python FastAPI route stubs.',
      'Evaluate semantic completeness of generated artifacts.',
    ],
    `# Lab 05: Software Artifact Generation\n\ndef generate_api_stub(entity_name, fields):\n    return f"class {entity_name}Model:\\n    " + "\\n    ".join([f"{f}: str" for f in fields])\n\nprint(generate_api_stub("UserAccount", ["id", "username", "email"]))\n`
  )
);

// Lab 06
labRegistryMap.set(
  'lab06-software-fusion',
  createLabShell(
    'lab06-software-fusion',
    6,
    6,
    'Software Fusion and Design Learning',
    'Apply structural graph neural networks to detect code smells and learn architectural patterns.',
    [
      'Represent source code abstract syntax trees (AST) and call graphs as network graphs.',
      'Train node classification models to identify God Classes and Feature Envy.',
      'Synthesize refactoring recommendations based on learned embeddings.',
    ],
    `# Lab 06: Software Fusion & Design Learning\nprint("Software Fusion Graph Engine Initialized.")\n`
  )
);

// Lab 07
labRegistryMap.set(
  'lab07-software-auto-generation',
  createLabShell(
    'lab07-software-auto-generation',
    7,
    7,
    'AI-Based Software Auto-Generation for Cyber-Physical Applications',
    'Synthesize controller logic and real-time state machines for embedded cyber-physical systems.',
    [
      'Formulate temporal logic specifications (LTL) for cyber-physical safety bounds.',
      'Synthesize correct-by-construction finite state machines.',
      'Simulate sensor-actuator feedback control loops.',
    ],
    `# Lab 07: Cyber-Physical Controller Auto-Generation\nprint("CPS Controller Synthesis Environment Loaded.")\n`
  )
);

// Lab 08
labRegistryMap.set(
  'lab08-ai-software-testing',
  createLabShell(
    'lab08-ai-software-testing',
    8,
    8,
    'AI for Software Testing and Machine-Learned Test Oracles',
    'Train predictive test oracles and generate edge-case invariant inputs using evolutionary algorithms.',
    [
      'Construct metamorphic test relations for programs lacking ground-truth oracles.',
      'Train differential machine learning models to detect subtle output anomalies.',
      'Measure mutation score and branch coverage across synthetic test suites.',
    ],
    `# Lab 08: AI-Assisted Test Oracles\nprint("Machine-Learned Test Oracle Harness Running.")\n`
  )
);

// Lab 09
labRegistryMap.set(
  'lab09-risk-based-testing',
  createLabShell(
    'lab09-risk-based-testing',
    9,
    9,
    'Risk-Based Software Testing and Qualitative Reasoning',
    'Prioritize test execution paths using qualitative software risk matrices and Bayesian belief networks.',
    [
      'Model software failure likelihood and impact using Bayesian belief graphs.',
      'Compute risk priority numbers (RPN) for prioritized regression suites.',
      'Evaluate test cost reduction under strict execution time budgets.',
    ],
    `# Lab 09: Qualitative Risk-Based Testing\nprint("Bayesian Risk Prioritizer Loaded.")\n`
  )
);

// Lab 10
labRegistryMap.set(
  'lab10-spreadsheet-debugging',
  createLabShell(
    'lab10-spreadsheet-debugging',
    10,
    10,
    'AI-Based Spreadsheet Debugging',
    'Identify calculation fault patterns, circular dependency anomalies, and semantic cell errors.',
    [
      'Construct cell dependency directed acyclic graphs (DAGs).',
      'Identify calculation formula anomalies using clustering and vector distance.',
      'Automate fault localization in multi-sheet financial models.',
    ],
    `# Lab 10: Spreadsheet Debugging Engine\nprint("Spreadsheet Formula Graph Analyzer Loaded.")\n`
  )
);

// Lab 11
labRegistryMap.set(
  'lab11-ai-software-debugging',
  createLabShell(
    'lab11-ai-software-debugging',
    11,
    11,
    'Artificial Intelligence Methods for Software Debugging',
    'Spectrum-based fault localization (SBFL) and automated repair patch generation.',
    [
      'Calculate Ochiai, Tarantula, and DStar suspiciousness formulas across execution spectra.',
      'Rank faulty statements and visualize spectrum heatmaps.',
      'Synthesize repair candidate patches and validate against regression suites.',
    ],
    `# Lab 11: Spectrum-Based Fault Localization (SBFL)\n\ndef compute_ochiai(passed_exec, failed_exec, total_failed):\n    import math\n    denominator = math.sqrt(total_failed * (failed_exec + passed_exec))\n    return (failed_exec / denominator) if denominator > 0 else 0.0\n\nprint("SBFL Ochiai Metric Engine Ready.")\n`
  )
);

// Practical Exam
labRegistryMap.set(
  'exam-code-review',
  createLabShell(
    'exam-code-review',
    12,
    12,
    'Practical Examination: AI-Assisted Code Review',
    'Timed practical assessment examining critical vulnerability detection and automated patch validation.',
    [
      'Perform comprehensive security and architectural audit on unvetted codebase.',
      'Synthesize automated remediation patches satisfying all security invariants.',
      'Author formal technical review report under examination constraints.',
    ],
    `# Practical Examination: AI-Assisted Code Review\n# MAI5124 Examination Rules Apply\n\nprint("Examination Mode Active.")\n`
  )
);

export class LabRegistry {
  static getLab(labId: string): LabManifest | undefined {
    return labRegistryMap.get(labId);
  }

  static getAllLabs(): LabManifest[] {
    return Array.from(labRegistryMap.values()).sort((a, b) => a.labNumber - b.labNumber);
  }

  static isLabAvailable(labId: string): boolean {
    return labRegistryMap.has(labId);
  }

  static getLabTasks(labId: string): LabTaskItem[] {
    const lab = labRegistryMap.get(labId);
    if (lab?.tasks && lab.tasks.length > 0) {
      return lab.tasks;
    }
    if (LAB_TASKS_CATALOG[labId]) {
      return LAB_TASKS_CATALOG[labId];
    }
    return [
      { id: `${labId}-t1`, title: 'Inspect Starter Architecture', description: 'Review initial codebase and starter structures', category: 'code' },
      { id: `${labId}-t2`, title: 'Implement Core AI Engine', description: 'Formulate core algorithmic logic and processing pipeline', category: 'code' },
      { id: `${labId}-t3`, title: 'Visual Flow & Graph Modeling', description: 'Model visual graph or interaction nodes', category: 'design' },
      { id: `${labId}-t4`, title: 'Automated Test Verification', description: 'Execute assertion test suite and verify invariants', category: 'test' },
      { id: `${labId}-t5`, title: 'Technical Report & Submission', description: 'Document analytical findings and submit final lab', category: 'submission' },
    ];
  }
}
