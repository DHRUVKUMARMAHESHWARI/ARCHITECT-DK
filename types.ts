
export interface ExtractedResume {
  candidateName: string;
  htmlContent: string;
  rawText: string;
  confidence: number;
}

export interface ATSFeedback {
  score: number;
  improvements: string[];
  suggestedKeywords: string[];
  redFlags: string[];
  jdMatchAnalysis?: string;
}

export type TemplateId = 
  | 'sourabh' 
  | 'jacqueline' 
  | 'minimal'
  | 'modern-mono'
  | 'editorial'
  | 'brutalist'
  | 'neon-tech'
  | 'swiss-grid'
  | 'academic-vintage'
  | 'geometric-eng'
  | 'executive-gold'
  | 'midnight-navy'
  | 'soft-minimal'
  | 'startup-clean'
  | 'deloitte';

export type AppState = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'EDITING' | 'ANALYZING' | 'IMPROVING';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'error' | 'success';
}

export interface User {
  _id: string;
  name: string;
  email: string;
  isPremium: boolean;
  downloads: number;
}
