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

## � API Documentation & Sample Payloads

### 1. Authentication (`/auth`)

#### **Register a New Institution**

`POST /auth/register`

- **Payload:**

```json
{
  "name": "Apollo Hospital",
  "email": "apollo@medical.com",
  "phone": "9876543210",
  "password": "Password123!",
  "role": "APPLICANT",
  "district": "Mumbai"
}
```

#### **Login**

`POST /auth/login`

- **Payload:**

```json
{
  "email": "apollo@medical.com",
  "password": "Password123!"
}
```

- **Sample Output:**

```json
{
  "access_token": "eyJhbGci...",
  "user": { "id": "uuid", "email": "...", "role": "APPLICANT" }
}
```

---

### 2. Forms & Applications (`/applications`)

#### **Get Available Forms**

`GET /forms`

- **Response:** List of forms (e.g., `FORM_3F`).

#### **Submit Application**

`POST /applications/submit`

- **Headers:** `Authorization: Bearer <token>`
- **Payload:**

```json
{
  "form_id": "uuid-form-3f",
  "institution_id": "uuid-inst",
  "office_id": "uuid-office",
  "values": [
    { "field_id": "uuid-f1", "value_text": "Apollo Hospital South" },
    { "field_id": "uuid-f2", "value_file_url": "s3://docs/registration.pdf" }
  ]
}
```

---

### 3. Workflow & Inspections (Staff Only)

#### **Auto-Assign Inspector**

`POST /inspections/auto-assign/:applicationId`

- **Role:** `OFFICER`
- **Logic:** Matches district + current workload.

#### **Submit Inspection Report**

`POST /inspections/report/:applicationId`

- **Role:** `INSPECTOR`
- **Payload:**

```json
{
  "report_text": "Premises inspected and found compliant.",
  "compliance_status": "COMPLIANT",
  "photos_url": "s3://reports/photos.zip"
}
```

---

### 4. Decisions & Certificates

#### **Approve Application**

`POST /decisions/approve/:applicationId`

- **Role:** `OFFICER`
- **Payload:**

```json
{
  "remarks": "Final approval granted after verification."
}
```

#### **Download Certificate**

`GET /certificates/:applicationId`

- **Response:** PDF URL and Certificate metadata.

---

## 🏗 Database Entities

| Table                | Purpose                                               |
| :------------------- | :---------------------------------------------------- |
| `users`              | Identity management (RBAC).                           |
| `institutions`       | Profile data for applicants.                          |
| `licensing_offices`  | Jurisdictional hierarchy (STATE, REGIONAL, DISTRICT). |
| `forms`              | Dynamic form definitions.                             |
| `applications`       | Main workflow tracking entity.                        |
| `inspection_reports` | Field validation results.                             |
| `audit_logs`         | Immutable trail of all system actions.                |

---

## 🧪 Testing with Postman

A Postman collection is provided in the root directory: `medical_forms_api.postman_collection.json`.

1. Open Postman.
2. Click **Import** and select the JSON file.
3. The collection includes:
   - **Auth**: Register and Login (Login script automatically sets `{{auth_token}}`).
   - **Forms**: Fetch dynamic structures.
   - **Applications**: Submit and track progress.
   - **Staff Operations**: Auto-assign, report, and approve.

---

## 🛡 Security & Design

- **JWT Protection**: All core routes are guarded by `@UseGuards(JwtAuthGuard)`.
- **RBAC**: enforced by `@Roles(UserRole.OFFICER, ...)` decorators.
- **Workflow Integrity**: Status transitions are validated by `WorkflowService`.
- **Infrastructure**: Ready for Cloud Object Storage (stores URLs).
