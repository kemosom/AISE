export interface AITutorContext {
  labId: string;
  examMode: boolean;
  userCode: string;
  errorTrace?: string;
  testFailures?: string[];
}

export interface AITutorResponse {
  available: boolean;
  message: string;
}

export interface AITutorProvider {
  explainError(context: AITutorContext): Promise<AITutorResponse>;
  provideHint(context: AITutorContext): Promise<AITutorResponse>;
  explainCode(context: AITutorContext): Promise<AITutorResponse>;
}

export class DefaultAITutorProvider implements AITutorProvider {
  private hasApiKey: boolean;

  constructor() {
    this.hasApiKey = Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
  }

  async explainError(context: AITutorContext): Promise<AITutorResponse> {
    if (context.examMode) {
      return {
        available: false,
        message: 'AI Assistance is strictly disabled during Examination Mode.',
      };
    }
    if (!this.hasApiKey) {
      return {
        available: false,
        message: 'AI Tutor service is currently optional and operates in offline pedagogical guidance mode.',
      };
    }
    return {
      available: true,
      message: 'Analyze the Request-Wait-Block synchronization specifications and verify that no thread requests a blocked event.',
    };
  }

  async provideHint(context: AITutorContext): Promise<AITutorResponse> {
    if (context.examMode) {
      return {
        available: false,
        message: 'AI Assistance is strictly disabled during Examination Mode.',
      };
    }
    return {
      available: true,
      message: 'Consider checking the capacity threshold in overflow_prevention before yielding the DRAIN_VALVE event.',
    };
  }

  async explainCode(context: AITutorContext): Promise<AITutorResponse> {
    if (context.examMode) {
      return {
        available: false,
        message: 'AI Assistance is strictly disabled during Examination Mode.',
      };
    }
    return {
      available: true,
      message: 'The BProgram engine coordinates event arbitration by prioritizing non-blocked requests across all registered generator threads.',
    };
  }
}

export const aiTutor = new DefaultAITutorProvider();
