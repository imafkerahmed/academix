# Project Context: Zoom Class App

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (using @tailwindcss/postcss)
- **Components**: Radix UI primitives and Shadcn-like architecture
- **Backend/Auth**: PocketBase (v0.26.6)
- **Infrastructure**: Docker Compose (PocketBase and Galène Video Server)
- **Video/Real-time**: Zoom Video SDK and Galène (self-hosted)

## 📁 Project Structure & Key Files

- **`src/lib/pocketbase.ts`**: The primary PocketBase client instance. It includes TypeScript interfaces for `User`, `Class`, `Course`, `Intake`, and `CourseIntake`.
- **`src/app/`**: Contains all App Router routes (API, dashboard, login/signup).
- **`docker-compose.yml`**: Configures the development environment, running PocketBase on port 8090 and Galène on port 8443.
- **`package.json`**: Defines scripts (dev, build, start) and lists major dependencies like `framer-motion`, `gsap`, and `recharts` for UI/UX.

## 🛠 Coding Standards & Instructions

1. **PocketBase Integration**:
   - Always use the centralized `pb` instance from `@/lib/pocketbase`.
   - When fetching data, utilize the provided TypeScript interfaces (e.g., `CourseIntake`, `CourseSubject`) to maintain type safety.
   - Authentication state is persisted via cookies to support Server Components.

2. **Styling**:
   - Use Tailwind CSS 4 utility classes for all styling.
   - Use `tailwind-merge` and `clsx` for conditional class joining.

3. **State & Data Fetching**:
   - Use `swr` for client-side data fetching and caching.
   - Use `react-hook-form` with `zod` for form validation.

4. **Role-Based Logic**:
   - The application supports multiple roles: `admin`, `student`, `lecturer`, `host`, and `attendee`.
   - Use the `getCurrentUser()` helper to verify roles before performing sensitive operations.

5. **Video Classroom**:
   - The project integrates both Zoom Video SDK and Galène. Check `services/galene` for video server configurations.

## ⚠️ Known Constraints

- **Docker**: PocketBase runs in a container with persistent data stored in `./services/pocketbase/pb_data`.
- **Environment Variables**: Sensitive URLs and keys are stored in `.env.local`. Always use `process.env.NEXT_PUBLIC_POCKETBASE_URL` for the backend connection.
