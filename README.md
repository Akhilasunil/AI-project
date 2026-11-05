# Company AI

Internal knowledge assistant for employees and administrators. Phase 1 is the foundation: sign-in, role-based access, and the employee and admin shells.

The workspace root is the project. `client/` is the React app and `server/` is the API.

## Phase 1 status

Working now:

- Email and password sign-in, with show/hide password, validation, loading, and error states
- Hashed passwords, JWT sessions, and server-side role checks
- Logout that invalidates the current token
- Employee and admin layouts, with protected routes
- Profile details for the signed-in account
- Development-only seed for the first administrator, plus an optional employee

Not built yet: asking questions, projects, knowledge resources, document upload, learning cards, dashboard metrics, and OpenAI. Those screens are honest empty states. The API does not call OpenAI in this phase, so no API key is required.

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Install

From the project root:

```powershell
npm install
```

## Configure

```powershell
Copy-Item server\.env.example server\.env
```

Edit `server/.env`:

- Set `JWT_SECRET` to a random string of at least 16 characters.
- Set `MONGODB_URI` if MongoDB is not on `mongodb://127.0.0.1:27017/company-ai`.
- Replace the sample seed passwords before using this anywhere other than your own machine.

The sample local accounts in `server/.env.example` are:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@company.test | DevAdmin-12345 |
| Employee | employee@company.test | DevEmployee-12345 |

`client/.env` is optional. The app calls `http://localhost:5000/api` when `VITE_API_URL` is unset. Copy `client/.env.example` only if the API origin changes. Do not put secrets in client environment variables.

## Seed the first administrator

There is no public registration page, and no API that creates administrators.

```powershell
npm run seed
```

The script reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `server/.env`. If `SEED_EMPLOYEE_EMAIL` is set, it also creates that employee. Running it again updates those same accounts.

Seeding is refused when `NODE_ENV=production` unless `SEED_ALLOW=true`.

## Run

```powershell
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:5000

Employees land on Ask AI. Administrators land on the admin dashboard.

Other commands:

```powershell
npm run dev:server
npm run dev:client
npm test
npm run build
npm start
```

`npm start` runs the API only. Build the client first with `npm run build` if you are serving the production bundle separately.

## Asking questions

Administrators upload PDF, DOCX, or TXT files from Company Documents, and add learning links from Learning Resources. A video can include a thumbnail image or an image URL. Published documents are indexed as text. Employees ask from Ask AI.

`AI_PROVIDER=mock` is the default. Mock answers use that extracted text and the saved resource title and description. They do not call OpenAI, open the link, or watch the video. If the approved sources do not cover the question, the answer is exactly: `I couldn't find this information in the approved company sources.`

To use OpenAI, set the key only in `server/.env`:

```
AI_PROVIDER=openai
OPENAI_API_KEY=your-key
OPENAI_MODEL=your-answer-model
OPENAI_EMBEDDING_MODEL=your-embedding-model
```

The example model names are placeholders. Leave the key empty to stay in mock mode.

## Environment variables

Server (`server/.env`):

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. Defaults to 5000. |
| `MONGODB_URI` | MongoDB connection string. Required. |
| `JWT_SECRET` | Signing secret, at least 16 characters. Required. |
| `JWT_EXPIRES_IN` | Token lifetime. Defaults to 8h. |
| `CLIENT_ORIGIN` | Allowed browser origin. Defaults to http://localhost:5173. |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seed administrator. |
| `SEED_EMPLOYEE_*` | Optional development employee. |
| `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL` | `mock` answers from uploaded text without a key. `openai` uses the Responses API when a key is set. |
| `UPLOAD_DIR` | Optional folder for uploaded files. Defaults to `server/uploads`. Files are not served from a public URL. |

Client:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL, including `/api`. |

## Authentication notes

- Passwords are hashed with bcrypt before they are stored.
- The browser keeps the JWT in `sessionStorage` and sends it as `Bearer` authorization. Closing the tab clears it.
- Each token includes a version stored on the user. Sign-out increments that version, so the previous token stops working.
- `/api/admin` routes require a current administrator. An employee token receives 403. A missing token receives 401.
- Sign-in is rate limited to 10 attempts per 15 minutes outside the test suite.
- A stolen token can still be read by script on the page because it is in `sessionStorage`. A later phase can move it to an HttpOnly cookie.

## Tests

```powershell
npm test
```

Server tests use an in-memory MongoDB. They cover login, inactive accounts, session expiry after logout, and admin authorization. Client tests cover the time-based greeting.

## Project layout

```
client/                 React, Vite, Tailwind
  src/components/       Shared UI and route guards
  src/layouts/          Employee and admin shells
  src/pages/            Auth, employee, and admin screens
  src/services/         API client
server/
  src/config/           Environment and MongoDB
  src/controllers/
  src/middleware/
  src/models/
  src/routes/
  src/utils/
  scripts/seedAdmin.js
  tests/
```

Uploaded files and `.env` files are gitignored.
