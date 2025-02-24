# Reports System Architecture

## Overview
The Reports system is designed to be modular, scalable, and maintainable while keeping the main ReportsPage under 300 lines. It follows a component-based architecture where each report type is isolated in its own module.

## Directory Structure
```
src/
├── components/
│   └── reports/
│       ├── types.ts              # Shared types and interfaces
│       ├── BaseReport.tsx        # Base report component
│       ├── sales/               # Sales report components
│       ├── products/            # Product report components
│       ├── transactions/        # Transaction report components
│       └── inventory/           # Inventory report components
├── hooks/
│   └── useReportData.ts        # Shared data fetching hook
└── pages/
    └── ReportsPage.tsx         # Main container page
```

## Core Principles

1. **Modularity**
   - Each report type has its own directory
   - Independent data fetching logic
   - Isolated state management
   - Self-contained styling

2. **Reusability**
   - Common interfaces in `types.ts`
   - Shared base component in `BaseReport.tsx`
   - Reusable data fetching hook `useReportData`
   - Common filter components (date range, branch selection)

3. **State Management**
   - Local state for UI components
   - Centralized date and branch filtering
   - Consistent loading states
   - Standardized error handling

## Adding New Reports

### Step 1: Create Report Directory
```bash
src/components/reports/[report-type]/
├── index.tsx           # Main export
├── [ReportName].tsx   # Report implementation
├── use[ReportName].ts # Custom hook for data
└── types.ts           # Report-specific types
```

### Step 2: Implement Report Component
```typescript
// src/components/reports/[report-type]/[ReportName].tsx
import { BaseReport } from '../BaseReport';
import { useReportData } from '../../../hooks/useReportData';
import type { ReportProps } from '../types';

export function NewReport({ selectedBranch, dateRange }: ReportProps) {
  const reportData = useReportData({
    fetchData: () => fetchReportData(selectedBranch, dateRange),
    dependencies: [selectedBranch, dateRange]
  });

  return (
    <BaseReport
      title="Report Title"
      data={reportData}
      renderContent={(data) => (
        // Render report content
      )}
    />
  );
}
```

### Step 3: Add to ReportsPage
```typescript
import { NewReport } from '../components/reports/[report-type]';

// Add to the reports grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <NewReport
    selectedBranch={selectedBranch}
    dateRange={dateRange}
    branches={branches}
    onBranchChange={setSelectedBranch}
  />
</div>
```

## Data Flow

1. **Filter Changes**
   ```
   ReportsPage
   ├── DateRangeSelector → updates dateRange
   └── BranchSelector → updates selectedBranch
   ```

2. **Data Fetching**
   ```
   Report Component
   ├── useReportData hook
   │   ├── Manages loading state
   │   ├── Handles errors
   │   └── Stores report data
   └── BaseReport
       └── Renders appropriate UI
   ```

3. **Error Handling**
   ```
   useReportData
   ├── Try: Fetch data
   ├── Catch: Set error state
   └── Finally: Update loading state
   ```

## Best Practices

1. **Code Organization**
   - Keep report components focused and small
   - Extract complex logic to custom hooks
   - Use TypeScript for better type safety
   - Follow consistent naming conventions

2. **Performance**
   - Implement proper memoization
   - Use pagination for large datasets
   - Optimize re-renders
   - Cache report data when appropriate

3. **Accessibility**
   - Include proper ARIA labels
   - Ensure keyboard navigation
   - Provide loading indicators
   - Handle error states gracefully

4. **Testing**
   - Write unit tests for each report
   - Test loading states
   - Test error scenarios
   - Test filter interactions

## Common Patterns

1. **Data Fetching**
```typescript
const { data, isLoading, error } = useReportData({
  fetchData: async () => {
    const result = await supabase
      .from('your_table')
      .select('*')
      .eq('business_code', businessCode)
      .eq('branch_name', selectedBranch);
    return result.data;
  },
  dependencies: [businessCode, selectedBranch]
});
```

2. **Content Rendering**
```typescript
renderContent={(data) => (
  <div className="space-y-4">
    <div className="flex justify-between">
      <h3>{title}</h3>
      <ExportButton data={data} />
    </div>
    <ReportVisualization data={data} />
    <ReportTable data={data} />
  </div>
)}
```

## Translations
- Add new report strings to `reports.ts`
- Follow the existing translation pattern
- Include loading and error messages
- Support RTL languages

## Security Considerations
- Validate user permissions
- Filter data by business_code
- Sanitize user inputs
- Handle sensitive data appropriately

Remember to keep the ReportsPage as a container component and move all specific report logic into their respective modules. This ensures maintainability and keeps the codebase organized as more reports are added.
