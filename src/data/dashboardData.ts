export interface DashboardStatItem {
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
}

export interface CareerHealthMetric {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  status: string;
  statusColor: 'gold' | 'amber' | 'indigo' | 'green';
  ringColor: string;
}

export interface DashboardResumeItem {
  id: string;
  title: string;
  updatedTime: string;
  atsScore: number;
  isReal?: boolean;
  rawResume?: any;
}

export interface RecentAnalysisItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  type: 'ats' | 'github' | 'resume' | 'leetcode';
  score?: number;
}

export const defaultDashboardStats: DashboardStatItem[] = [
  { id: 'career', label: '[ Career Score ]', value: '78/100' },
  { id: 'resume', label: '[ Resume ]', value: '82' },
  { id: 'ats', label: '[ ATS ]', value: '74' },
  { id: 'github', label: '[ GitHub ]', value: '81' },
];

export const defaultCareerHealthMetrics: CareerHealthMetric[] = [
  {
    id: 'resume',
    title: 'Resume',
    score: 82,
    maxScore: 100,
    status: 'Strong',
    statusColor: 'gold',
    ringColor: '#C6A75E', // Royal Gold
  },
  {
    id: 'ats',
    title: 'ATS Compatibility',
    score: 74,
    maxScore: 100,
    status: 'Needs improvement',
    statusColor: 'amber',
    ringColor: '#C49A4A', // Warning Amber
  },
  {
    id: 'github',
    title: 'GitHub Profile',
    score: 81,
    maxScore: 100,
    status: 'Strong',
    statusColor: 'indigo',
    ringColor: '#6366A8', // AI Indigo
  },
  {
    id: 'coding',
    title: 'Coding Readiness',
    score: 68,
    maxScore: 100,
    status: 'Improve',
    statusColor: 'amber',
    ringColor: '#C49A4A', // Warning Amber
  },
];

export const defaultDashboardResumes: DashboardResumeItem[] = [
  {
    id: 'sample-1',
    title: 'Software Engineer Resume',
    updatedTime: 'Updated 2 hours ago',
    atsScore: 82,
  },
  {
    id: 'sample-2',
    title: 'Frontend Developer Resume',
    updatedTime: 'Updated yesterday',
    atsScore: 76,
  },
];

export const defaultRecentAnalyses: RecentAnalysisItem[] = [
  {
    id: 'ra-1',
    title: 'ATS analysis completed',
    subtitle: 'Software Engineer Resume',
    timestamp: '2 hours ago',
    type: 'ats',
    score: 82,
  },
  {
    id: 'ra-2',
    title: 'GitHub audit completed',
    subtitle: 'github.com/example',
    timestamp: 'Yesterday',
    type: 'github',
    score: 81,
  },
  {
    id: 'ra-3',
    title: 'Resume updated',
    subtitle: 'Frontend Developer Resume',
    timestamp: '2 days ago',
    type: 'resume',
  },
];
