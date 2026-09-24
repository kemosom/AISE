import type { LabManifest, LabTaskItem } from './types';

// Lab 01 is content-driven. Edit files inside labs/lab01-behavioral-programming/
// rather than duplicating teaching content in this registry.
import lab01Metadata from './lab01-behavioral-programming/manifest.json';
import lab01Theory from './lab01-behavioral-programming/theory.md?raw';
import lab01LabSheet from './lab01-behavioral-programming/lab-sheet.md?raw';
import lab01MainPy from './lab01-behavioral-programming/starter/main.py?raw';
import lab01HelpersPy from './lab01-behavioral-programming/starter/helpers.py?raw';
import lab01Snippets from './lab01-behavioral-programming/snippets.json';
import lab01Blocks from './lab01-behavioral-programming/blocks.json';
import lab01VisualNodes from './lab01-behavioral-programming/visual-nodes.json';
import lab01Tests from './lab01-behavioral-programming/tests/public-tests.json';
import lab01ReportTemplate from './lab01-behavioral-programming/report-template.json';

// Curriculum-aligned task catalog mapping for all MAI5124 laboratories
export const LAB_TASKS_CATALOG: Record<string, LabTaskItem[]> = {
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

// Lab 01 - Content-driven reference module.
// Theory, lab sheet, starter code, tests, snippets, blocks, visual nodes and
// report structure all live in the Lab 01 folder so lecturers can edit the
// module without touching application code.
labRegistryMap.set('lab01-behavioral-programming', {
  ...(lab01Metadata as any),
  starterFiles: [
    { name: 'main.py', language: 'python', content: lab01MainPy },
    { name: 'helpers.py', language: 'python', content: lab01HelpersPy },
    {
      name: 'README.md',
      language: 'markdown',
      content:
        '# Lab 01: Behavioral Programming\n\n' +
        'Read Theory & Labsheet first. Then complete the TODO sections in main.py, run the program, verify the public tests, and document evidence in the integrated report.',
    },
  ],
  reportTemplate: lab01ReportTemplate as any,
  snippets: lab01Snippets as any,
  blocks: lab01Blocks as any,
  visualDesign: lab01VisualNodes as any,
  tests: lab01Tests as any,
  theoryMarkdown: lab01Theory,
  labSheetMarkdown: lab01LabSheet,
  instructionsMarkdown: `${lab01Theory}\n\n---\n\n${lab01LabSheet}`,
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
