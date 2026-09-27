# EduWrap Next.js website

The original PHP website has been rebuilt with the Next.js App Router while preserving its public URL structure, visual system, course content, and assets.

## Architecture

- `app/` — routes, metadata, sitemap, robots, and the lead API endpoint
- `components/` — reusable presentation and interactive UI
- `content/` — typed site and course data; this is the CMS boundary
- `lib/` — shared metadata helpers
- `public/assets/` — existing optimized images and static assets

All course pages are statically generated from `content/courses.ts`. To connect a headless CMS, replace that module with a server-only adapter that returns the same `Course` type from `content/types.ts`. The route components and URLs do not need to change.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_SITE_URL` — canonical production origin
- `CONTACT_EMAIL` — inbox that receives validated website enquiries (defaults to `eduwrap0@gmail.com`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASSWORD` — server-side SMTP connection used for account, payment, and completion emails
- `SMTP_FROM_EMAIL` and `SMTP_FROM_NAME` — optional sender address and display name (defaults to the SMTP user and `EduWrap`)

The form deliberately shows a contact fallback until a webhook is configured; it never reports a lead as saved when no destination exists.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The production build uses standalone output and can run on Vercel, any Node.js host, or a container platform.

## URL compatibility

Current routes remain `/`, `/courses`, `/courses/{slug}`, `/about`, `/contact`, and `/thank-you`. Legacy `.php`, `/index`, and `/{slug}-course` requests are redirected permanently in `next.config.ts`.

## Authentication, faculty, and student accounts

The application includes role-based admin, faculty, and student portals using MongoDB, Mongoose, bcryptjs, signed JWTs, strict HTTP-only cookies, and Zod validation. There is no public registration API. Administrators create faculty accounts and can create students with an optional faculty assignment. Faculty members can create students, who are automatically assigned to them.

Copy `.env.example` to `.env.local` and configure all authentication values. Reserved characters in MongoDB usernames and passwords must be percent-encoded; for example, `@` in a password becomes `%40`. Generate `JWT_SECRET` with a cryptographically secure password generator and use at least 32 random characters. Never prefix server secrets with `NEXT_PUBLIC_`.

Create the first administrator once:

```bash
npm run seed:admin
```

The seed reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`, hashes the password with 12 bcrypt rounds, and exits without changing an existing administrator. It never prints credentials. Remove admin seed values from the deployed runtime after seeding if the hosting platform permits it.

Portal routes:

- `/login` — administrator, faculty, and student login
- `/admin/dashboard` — student totals and recent registrations
- `/admin/students` — search, filter, paginate, inspect, activate, deactivate, reset passwords, and delete student accounts
- `/admin/students/new` — administrator-only student registration
- `/admin/faculty` and `/admin/faculty/new` — administrator-only faculty management and registration
- `/faculty/dashboard` — faculty overview for assigned students
- `/faculty/students` and `/faculty/students/new` — manage and register only the signed-in faculty member's students
- `/student/dashboard` — the authenticated student's own profile

### Security model

- JWTs contain only `userId`, `role`, and standard JWT timing/issuer/audience claims. They are signed with HS256 and accepted only from a strict SameSite, HTTP-only cookie.
- The Next.js 16 `proxy.ts` performs early page redirects. Every protected server layout and API independently verifies the signature and checks the current MongoDB user, active status, and stored role.
- All mutation endpoints reject cross-origin browser requests. SameSite `strict` provides an additional CSRF boundary. If the application later requires cross-site embedding or `SameSite=None`, add synchronizer CSRF tokens before changing the cookie policy.
- Zod schemas are strict, emails are normalized, search strings are escaped, IDs are validated, and updates use explicit allowlisted fields. Request bodies are never passed directly to Mongoose.
- Login failures use a generic response and a dummy bcrypt comparison. Failed logins are limited per IP/email using MongoDB-backed records with TTL cleanup. Password resets are limited per administrator.
- Password changes and deactivation invalidate existing student sessions. Security-sensitive actions produce structured logs containing IDs and action names, never passwords or tokens.
- Security headers deny framing, MIME sniffing, unnecessary browser permissions, and unsafe opener sharing. Configure HSTS at the TLS reverse proxy or hosting provider after HTTPS is confirmed for every production subdomain.

### Production checklist

1. Rotate any database password or JWT secret that has ever appeared in chat, logs, or source code.
2. Use a dedicated least-privilege MongoDB database user, Atlas IP/network controls, TLS, backups, and monitoring.
3. Set `NODE_ENV=production`, a 32+ character random `JWT_SECRET`, and an HTTPS site URL.
4. Run `npm run seed:admin` from a trusted one-off environment, verify login, then remove seed credentials from runtime configuration.
5. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` in CI.
6. Configure centralized audit-log retention and alerts for repeated failures, password resets, deactivations, and deletions.
7. Apply HSTS and a deployment-specific Content Security Policy at the reverse proxy. The current public site loads Bootstrap, fonts, and icons from CDNs, so test the allowlist before enforcing CSP.
8. Use a managed distributed rate limiter if authentication traffic outgrows the included MongoDB limiter.

### Manual verification

After seeding, start the application with `npm run dev`. Confirm that the admin can log in, create a student, and log out; the student can log in but receives `403` from admin APIs; inactive users receive the generic login error; unsupported fields such as `role` receive `400`; duplicate emails receive `409`; and deleting/resetting/status changes require an authenticated admin cookie.
