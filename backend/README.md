# Licensing Workflow Backend (Form 3F)

A government-grade licensing backend built with **NestJS**, **PostgreSQL**, and **TypeORM**. This system manages medical institution recognition for essential narcotic drugs (Form 3F).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=3000
   DATABASE_URL=postgres://harshil:0000@localhost:5432/medical_forms
   JWT_SECRET=your-secret-key
   JWT_EXPIRATION=24h
   ```

### Running the App

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

---

## 🔑 Demo Credentials

The system automatically seeds data on the first run.

| Role          | Email              | Password      |
| :------------ | :----------------- | :------------ |
| **Admin**     | `admin@gov.in`     | `password123` |
| **Officer**   | `officer@gov.in`   | `password123` |
| **Inspector** | `inspector@gov.in` | `password123` |

---

## 🛠 Database Structure (PostgreSQL)

### Core Modules & Tables

#### 1. Identity & Users

- `users`: Core user accounts (UUID, RBAC roles, district).
- `institutions`: Profile data for medical institutions (One-to-One with user).

#### 2. Organizational Hierarchy

- `licensing_offices`: STATE, REGIONAL, and DISTRICT offices.
- `licensing_officers`: Linked to users with `SCRUTINY` or `FINAL` approval levels.
- `inspectors`: Field inspectors with hierarchical mapping.
- `inspector_jurisdictions`: Maps inspectors to specific States, Districts, and Taluks.

#### 3. Dynamic Forms Engine

- `forms`: Definitions (e.g., FORM_3F).
- `form_fields`: Dynamic fields (text, number, file, select) with JSON validation rules.

#### 4. Application Workflow

- `applications`: The core record tracking status (`SUBMITTED` -> `APPROVED`).
- `application_values`: Stores dynamic responses for each field.
- `documents`: Stores file references for attachments.
- `queries`: Record of clarifications requested by officers.

#### 5. Inspection & Decisions

- `inspection_assignments`: Links applications to inspectors with due dates.
- `inspection_reports`: Compliance status and text submitted by inspectors.
- `decisions`: Final approval/rejection records with remarks.
- `certificates`: Issued licenses with expiry dates and PDF URLs.
- `audit_logs`: Immutable record of every action performed in the system.

---

## 📡 API Routes

### Authentication (`/auth`)

- `POST /auth/register`: Register a new institution user.
- `POST /auth/login`: Login and receive JWT access token.

### Forms (`/forms`)

- `GET /forms`: List all active forms.
- `GET /forms/:id/fields`: Get dynamic fields for a specific form.

### Applications (`/applications`)

- `POST /applications/submit`: Submit a new application with dynamic data.
- `GET /applications/:id`: Get full application details and current status.
- `POST /applications/:id/query`: Raise a clarification request (Officers only).

### Inspections (`/inspections`)

- `POST /inspections/auto-assign/:id`: Automatically assign an inspector based on district and workload.
- `POST /inspections/report/:id`: Submit a field inspection report (Inspectors only).

### Decisions & Certificates (`/decisions`, `/certificates`)

- `POST /decisions/approve/:id`: Final approval of an application.
- `GET /certificates/download/:applicationId`: Download the issued license PDF.

---

## 🛡 Security & Design Patterns

- **RBAC Guards**: Restricts access based on roles (`APPLICANT`, `INSPECTOR`, `OFFICER`, etc.).
- **Workflow State Machine**: Prevents invalid status transitions.
- **Auto-Assignment Logic**: Round-robin style assignment considering inspector workload and district jurisdiction.
- **UUIDs**: All primary keys use UUIDs for security and scalability.
- **Soft Deletes**: Critical entities use soft deletes to preserve audit trails.
