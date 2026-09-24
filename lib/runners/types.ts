export interface ExecutionResult {
  stdout: string;
  stderr: string;
  error?: string;
  exitCode: number;
  executionTimeMs: number;
  plots?: string[]; // Base64 PNG images for Matplotlib plots
}

export interface CodeRunner {
  name: string;
  initialize(): Promise<void>;
  run(code: string, files?: Array<{ name: string; content: string }>): Promise<ExecutionResult>;
  stop(): void;
  reset(): Promise<void>;
}
