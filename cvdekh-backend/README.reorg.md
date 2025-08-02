# Backend Directory Reorganization Plan

This document outlines the step-by-step plan to reorganize the `cvdekh-backend/src` directory for improved maintainability, clarity, and scalability. Follow these steps to refactor the codebase into a modern, modular structure.

---

## 1. Create the New Directory Structure

```
src/
├── controllers/     # Route handler logic (business logic)
├── models/          # TypeScript interfaces/types for data
├── db/              # Database connection and setup
├── config/          # Configuration files
├── middleware/      # Express middleware
├── routes/          # Route definitions
├── services/        # Business logic and integrations
├── utils/           # Utility/helper functions
├── workers/         # Background jobs (BullMQ, etc.)
```

---

## 2. Reorganize Files by Function

### 2.1 Controllers
- Move all route handler functions from `routes/resume.ts` to `controllers/resume.controller.ts`.
- Create additional controllers as needed (e.g., `healthcheck.controller.ts`, `skills.controller.ts`).
- Controllers should contain only business logic, not route definitions.

### 2.2 Routes
- Keep only route definitions and middleware in `routes/*.ts` files.
- Import controller functions and attach them to routes.

### 2.3 Models
- Move all TypeScript interfaces/types (e.g., `ResumeData`, `ImprovedResumeResponse`) to `models/`.
- Split models by domain: `resume.model.ts`, `skill.model.ts`, etc.
- Import models where needed for type safety.

### 2.4 Database Layer
- Place Supabase client and DB setup in `db/` (e.g., `db/index.ts`, `db/supabase.ts`).
- Centralize DB connection logic.

### 2.5 Utils
- Place reusable helpers in `utils/` (e.g., `ApiError.ts`, `ApiResponse.ts`, `asyncHandler.ts`).

---

## 3. Update File Structure

- Move interfaces from `src/interfraces/` to `src/models/`.
- Update all imports in services, controllers, and middleware to use the new model paths.
- Create `src/app.ts` for Express app configuration and `src/index.ts` as the entry point.

---

## 4. Apply OpenAPI & RESTful Best Practices

- Standardize route naming (e.g., `/api/resumes/:id` instead of `/api/resume/get-resume`).
- Use consistent HTTP status codes and response formats (see `utils/ApiResponse.ts`).
- Add validation and error handling middleware as needed.

POST   /resumes/parse
GET    /resumes/parse/{jobId}
POST   /resumes/generate
GET    /resumes/original
POST   /resumes/improve
POST   /resumes
GET    /resumes
DELETE /resumes/{resumeId}
GET    /skills

---

## 5. Implementation Order

1. Create new directories and utility files.
2. Move and split models.
3. Create database layer.
4. Extract controllers from routes.
5. Update routes to use controllers.
6. Refactor server/app entry points.
7. Update all imports.
8. Apply RESTful and OpenAPI conventions.
9. Test and validate.

---

## 6. Benefits

- Clear separation of concerns
- Easier testing and maintenance
- Consistent, scalable codebase
- Modern RESTful API design

---

**Refer to this document during the reorganization process. Update as needed to reflect any project-specific decisions.**
