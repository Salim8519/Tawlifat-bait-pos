import { Branch } from '../../services/dashboardService';

export interface ReportProps {
  selectedBranch: string;
  branches: Branch[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onBranchChange: (branch: string) => void;
}

export interface ReportData {
  isLoading: boolean;
  error: string | null;
  data: any;
}
