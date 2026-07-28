# Admin Panel Build Plan

## Architecture Decision
- **Align with existing codebase**: Next.js 16 App Router, Express, Prisma/PostgreSQL
- **Admin route prefix**: `/admin/*` for frontend, `/api/v1/admin/*` for backend
- **Auth**: JWT + Role-based (ADMIN role only)
- **UI**: Reuse existing UI components + build admin-specific components

## Build Order

### Phase A — Backend Infrastructure
1. Update Prisma schema with admin models (ActivityLog, Notification, SiteSettings, SEO, Media)
2. Create admin auth middleware
3. Create API utilities (pagination, filtering, sorting helpers)
4. Build admin route structure

### Phase B — Backend API Modules
1. Admin Auth (login, verify, profile)
2. Dashboard / Analytics
3. Products CRUD
4. Categories CRUD
5. Orders management
6. Customers management
7. Reviews management
8. Coupons management
9. Media management
10. Settings management
11. SEO management
12. Activity logs

### Phase C — Frontend Infrastructure
1. Admin layout with sidebar
2. Admin login page
3. Admin route protection
4. Shared admin components (DataTable, StatsCard, ActionBar, etc.)

### Phase D — Frontend Pages
1. Dashboard
2. Products (list, create, edit)
3. Categories
4. Orders
5. Customers
6. Reviews
7. Coupons
8. Media Library
9. Settings
10. SEO
11. Analytics
12. Activity Log
