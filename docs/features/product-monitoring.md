# Product Monitoring System

## Overview
The Product Monitoring System provides real-time notifications for new vendor product submissions in the Tawliat Bait POS system. It automatically checks for new pending products and notifies business owners and managers through toast notifications.

## Features

### Background Monitoring
- Runs every 30 seconds in the background
- Monitors products with `current_page: 'upcoming_products'`
- Filters by business code and branch name
- Tracks product state to avoid duplicate notifications

### Smart Notifications
- Compact, non-intrusive toast notifications
- Bilingual support (Arabic/English)
- RTL/LTR layout adaptation
- Quick actions:
  - Review: Redirects to Upcoming Products page
  - Ignore: Dismisses the notification

## Technical Implementation

### Components

1. **ProductMonitorService**
```typescript
// Start monitoring
startProductMonitoring(
  businessCode: string,
  branchName?: string,
  language: 'en' | 'ar' = 'en'
)

// Stop monitoring
stopProductMonitoring()
```

2. **ToastNotification Component**
```typescript
interface ToastNotificationProps {
  visible: boolean;
  message: string;
  subMessage: string;
  onAction: () => void;
  onIgnore: () => void;
  actionText: string;
  language: 'en' | 'ar';
}
```

### Integration Points

1. **App Component**
```typescript
// Initializes monitoring on user login
useEffect(() => {
  if (user?.businessCode) {
    startProductMonitoring(
      user.businessCode,
      user.role === 'cashier' ? currentBranch?.branch_name : undefined,
      language
    );
  }
  return () => stopProductMonitoring();
}, [user?.businessCode, language]);
```

2. **UpcomingProductsPage**
```typescript
// Resets monitoring state when page is visited
useEffect(() => {
  if (user?.businessCode) {
    startProductMonitoring(
      user.businessCode,
      isCashier ? currentBranch?.branch_name : selectedBranch,
      language
    );
  }
}, [user?.businessCode, selectedBranch, language]);
```

## Role-Based Behavior

### Business Owner/Manager
- Receives notifications for all branches
- Can choose specific branch to monitor
- Full access to product review functionality

### Cashier
- Only receives notifications for assigned branch
- Branch-specific product visibility
- Limited to branch-specific actions

## Notification Content

### English
- Message: "{count} new products awaiting review"
- Sub-message: "Click to review"
- Action: "Review"

### Arabic
- Message: "{count} منتجات جديدة في قائمة الانتظار"
- Sub-message: "اضغط للمراجعة"
- Action: "مراجعة"

## Performance Considerations
- Efficient state management to avoid unnecessary checks
- Debounced notifications to prevent overwhelming users
- Automatic cleanup on component unmount
- Memory-efficient product tracking

## Future Improvements
- Configurable check intervals
- Notification sound options
- Batch notification support
- Notification history
- Custom notification preferences per user
