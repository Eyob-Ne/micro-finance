# DMMS Project Rules

## Stack
- **Frontend:** React 18 + Vite + TailwindCSS + React Router v6 + lucide-react + react-hot-toast + recharts
- **Backend:** Node.js + Express + PostgreSQL (`pg` driver, raw SQL, NO ORM) + JWT + bcrypt
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Supabase Storage

## Critical Constraints
- **Responsive Design:** The entire UI MUST be fully responsive and mobile-friendly. Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) for all layouts, grids, flexboxes, and typography. Ensure tables can scroll horizontally on mobile, and the sidebar collapses into a hamburger menu on smaller screens.
- **NEVER use `window.alert` or `window.confirm`.** Always use `react-hot-toast` for notifications and a custom modal component for confirmations.
- **Database:** Always use parameterized queries (`$1`, `$2`) to prevent SQL injection. Never concatenate strings.
- **Authentication:** All routes except `/api/auth/login` must use the `verifyToken` middleware.
- **Audit:** Every write operation (create/update/delete) must call the `logAudit` utility.
- **Frontend:** Use Tailwind utility classes only. No custom CSS files unless absolutely necessary.

## Folder Structure
- Backend code goes in `/backend/src`.
- Frontend code goes in `/frontend/src`.
- Shared types (if any) should be duplicated in both projects for simplicity in this MVP.
