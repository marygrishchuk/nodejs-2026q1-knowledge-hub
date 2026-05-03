import { Injectable, InternalServerErrorException } from '@nestjs/common';

interface AnalyzeOutput {
  analysis: string;
  suggestions: string[];
  severity: 'info' | 'warning' | 'error';
}

interface GenerateOutput {
  response: string;
}

@Injectable()
export class AiOutputValidator {
  validateAnalyzeOutput(jsonText: string): AnalyzeOutput {
    try {
      const parsed = JSON.parse(jsonText);

      if (!this.isValidAnalyzeOutput(parsed)) {
        return this.getFallbackAnalyzeOutput();
      }

      return {
        analysis: parsed.analysis,
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
        severity: this.isValidSeverity(parsed.severity)
          ? parsed.severity
          : 'info',
      };
    } catch (error) {
      return this.getFallbackAnalyzeOutput();
    }
  }

  validateGenerateOutput(jsonText: string): GenerateOutput {
    try {
      const parsed = JSON.parse(jsonText);

      if (typeof parsed.response !== 'string') {
        return { response: jsonText };
      }

      return { response: parsed.response };
    } catch (error) {
      return { response: jsonText };
    }
  }

  private isValidAnalyzeOutput(obj: any): boolean {
    return (
      obj &&
      typeof obj.analysis === 'string' &&
      Array.isArray(obj.suggestions) &&
      obj.suggestions.every((s: any) => typeof s === 'string') &&
      typeof obj.severity === 'string' &&
      this.isValidSeverity(obj.severity)
    );
  }

  private isValidSeverity(severity: any): severity is 'info' | 'warning' | 'error' {
    return ['info', 'warning', 'error'].includes(severity);
  }

  private getFallbackAnalyzeOutput(): AnalyzeOutput {
    return {
      analysis: 'Analysis could not be completed due to an unexpected response format.',
      suggestions: [
        'Please try again later',
        'Consider reviewing the article manually',
      ],
      severity: 'info',
    };
  }
}
