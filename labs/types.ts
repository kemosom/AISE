export interface LabSnippet {
  id: string;
  category: string;
  name: string;
  description: string;
  parameters?: string[];
  code: string;
}

export interface LabBlockDefinition {
  type: string;
  message0: string;
  args0?: any[];
  previousStatement?: any;
  nextStatement?: any;
  output?: any;
  colour: number;
  tooltip: string;
  codeGenerator: string; // python snippet template
}

export interface LabVisualGraph {
  nodes: Array<{
    id: string;
    type?: string;
    data: { label: string; [key: string]: any };
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

export interface LabTestCase {
  id: string;
  name: string;
  description: string;
  testCode: string;
  weight: number;
}

export interface ReportTemplateSection {
  id: string;
  title: string;
  required: boolean;
  placeholder?: string;
}

export interface LabReportTemplate {
  title: string;
  sections: ReportTemplateSection[];
}

export interface LabStarterFile {
  name: string;
  language: string;
  content: string;
}

export interface LabTaskItem {
  id: string;
  title: string;
  description: string;
  completed?: boolean;
  category?: 'code' | 'design' | 'test' | 'report' | 'submission';
}

export interface LabManifest {
  id: string;
  labNumber: number;
  week: number;
  title: string;
  shortDescription: string;
  estimatedDuration: string;
  language: 'python' | 'javascript' | 'html';
  runner: 'pyodide' | 'javascript' | 'web';
  packages: string[];
  features: {
    visualDesigner: boolean;
    blockly: boolean;
    functionPalette: boolean;
    testRunner: boolean;
    reportEditor: boolean;
    webPreview: boolean;
  };
  learningOutcomes: string[];
  tasks?: LabTaskItem[];
  starterFiles: LabStarterFile[];
  reportTemplate: LabReportTemplate;
  snippets: LabSnippet[];
  blocks?: LabBlockDefinition[];
  visualDesign?: LabVisualGraph;
  tests: LabTestCase[];
  instructionsMarkdown: string;
}
