import React from 'react';
import { DashboardPage } from './dashboard/DashboardPage';
import { 
  UserProfile, 
  UsageBalance, 
  ResumeDocument, 
  ResumeAnalysisRecord, 
  GitHubAnalysisRecord, 
  LeetCodeAnalysisRecord 
} from '../types';

interface DashboardViewProps {
  user: UserProfile | null;
  balance: UsageBalance | null;
  resumes: ResumeDocument[];
  analyses: ResumeAnalysisRecord[];
  githubAnalyses: GitHubAnalysisRecord[];
  leetcodeAnalyses: LeetCodeAnalysisRecord[];
  onNavigate: (tab: string) => void;
  onSelectResumeToEdit: (resume: ResumeDocument) => void;
  onViewAnalysisReport: (analysis: ResumeAnalysisRecord) => void;
  onDeleteResume?: (id: string) => void;
  onOpenCreditsModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = (props) => {
  return <DashboardPage {...props} />;
};

export { DashboardPage };
