# Subapp 2 (React/Vite + ASP.NET Core API) — implementation record

**Date:** 2026-11-04  
**Target:** `Kenihski/GamificationPlatformSPA`, branch `Salman-branch`  
**Reference:** `Kenihski/GamificationPlatform`, branch `Salman-Freyr-integration-ux`  
**Scope:** logging, error handling, input validation, and applicable Freyr MVC UX/accessibility changes adapted to SPA. No automated tests were requested or added.

## Increment 1 — API challenge rules and default image
**Commits:** `eab7fdb5`, `a17af61a`, `7c7d7197`, `43bbe263`, `097ce130`, `7ec6e09a`.

- Added `IsCore` to `ChallengeSaveDTO` for creation. Backend accepts Core selection only from authenticated administrators and forces all other creators to Community.
- Replaced the prior `make-core`/`make-community` endpoints with one `change-type` action requiring Admin role **and** creator ownership. Logs rejected cross-owner attempts and successful category changes.
- Updated both the details and My Challenges React interfaces to show only **Change Type** for the admin creator.
- Created challenge image defaults to the `Question 1` default image when no image URL is supplied; a missing default produces a validation error rather than a silent blank image.
- React challenge creation preselects/previews Question 1, removes No image from creation, explains image selection and preserves the ability to choose another image or upload.
- **Why:** Enforce category permissions in the API, match Subapp 1's newer requirements, and avoid unintentional blank challenge images.
- **Note:** Update Challenge retains its existing image behavior and does not change challenge category.

## Increment 2 — Quiz and registration feedback
**Commits:** `899a5a2e`, `678011c4`, `ae081b6e`.

- Added a question-by-question unanswered count in React, with distinct confirmation messages for some unanswered versus none answered.
- Kept timed automatic quiz submission and Exit Challenge handling independent of voluntary submit confirmation.
- Modal registration now closes the modal and goes to the Login route, showing successful registration feedback. Ordinary registration already redirected to Login and is retained.
- Success feedback on the login page uses `role="status"`.
- **Why:** Make consequential submission explicit while retaining the requested register-then-login flow.

## Increment 3 — Structured logging and error handling
**Commits:** `b0ad703c`, `3c08e51b`, `ca00193c`, `56083f30`.

- Preserved existing Serilog console/file configuration and request logging; added a centralized API exception handler that logs unexpected exceptions server-side and returns generic ProblemDetails JSON.
- Added warning-level security/event logging for unknown login attempts and duplicate account registration requests without recording passwords or raw credentials.
- React API client now extracts field validation messages from `ValidationProblemDetails.errors` and handles generic server errors without exposing exception internals.
- Registration service now supports both string-array errors and ASP.NET field-error dictionaries.
- **Why:** Provide useful diagnostics without disclosing exception details or exposing sensitive information.

## Increment 4 — Forms, UX, and accessibility
**Commits:** `4650dbb0`, `27a4b2ca`, `6fa8f83d`, `bb65162e`, `0f089a75`, `5610c3bd`, `e6796186`, `5edcd436`, `9bcef5d2`, `4bfb1048`, `debbf28a`, `058d5c11`.

- Home How It Works cards now offer Challenges and About with revised copy and an information icon.
- From 1200px, navbar also shows Challenges, Hall of Fame, Core Leaderboard; the sidebar continues to support narrower screens.
- Added focusable validation summaries in register/login, challenge create/edit, and question create/edit forms; focus moves to feedback after a submission/validation failure.
- Browser titles reflect common SPA routes.
- Existing SPA elements that already implement Freyr's accessibility patterns, such as descriptive labels, grouped quiz answers, creator hiding on Core challenges and achievement progress labels, are retained rather than duplicated.
- **Why:** Improve discoverability, keyboard workflows, and consistency between the two subapps.

## Increment 5 — Motion, carousel, achievements and styling
**Commits:** `f5b02900`, `68eb540d`, `3cde80cc`, `4ff2c7ca`, `f5612fc3`, `c7d2bab4`, `b6332fee`, `e32e28fc`, `1a920130`.

- Matrix preference now uses `matrix-animation-enabled` cookie with 90-day expiry, `SameSite=Lax`, `Path=/`, and `Secure` under HTTPS. Without saved preference it respects OS reduced-motion changes.
- Featured challenge carousel pauses rotation while hovered or keyboard-focused, and does not auto-rotate when reduced motion is requested.
- Achievement notifications now show up to three desktop toasts from 992px, introduced 2.5 seconds apart, and one bottom-centered mobile toast; toasts support focus/hover pause, staggered dismissal, close labeling and status announcements.
- Notification positioning follows measured navbar height.
- Global keyboard focus outline, destructive button contrast, alert contrast, responsive form sizing, and reduced-motion styling were enhanced.
- Delete Question / Delete Achievement actions use **Confirm deletion** with clearer consequence descriptions; Challenge Update now explains effects on attempt history.
- **Why:** Improve mobile and keyboard usability and communicate irreversible changes.

## Existing functionality deliberately retained
- Existing ASP.NET Core data annotations and controllers' validation checks; existing Serilog logging; existing question forms, quiz grouping and labels, SPA routing and API services.
- Creator labels remain hidden for Core challenges in featured carousel and challenge details, but visible for Community challenges.
- Existing question/achievement logic and persistence rules are not intentionally changed.
- No test files created or modified; no MVC code copied verbatim.

## Verification status and limitations
**Verified:** Repository content and commit writes succeeded; branch changes were inspected against the source structure; before/after GitHub comparison confirmed target branch changes.  
**Not verified:** `dotnet build`, Vite/TypeScript build, automated test execution, full manual browser scenarios and WCAG AA audit. Tool environment cannot run the checked-out .NET project and the repository was accessed through the GitHub connector.  
**Still advisable:** Comprehensive browser review of all Create/Edit/Delete pages and color contrast; targeted review of SPA-specific behavior not present in the MVC project. This integration adapts the relevant features; it is not a claim of pixel-perfect parity or full WCAG compliance.

## Manual checks before merging or delivery
1. Run `dotnet build api/api.csproj`; run `npm ci && npm run build` from `client`.
2. Regular user attempts Core creation, admin Core/Community creation, admin owner versus nonowner Change Type, including a direct unauthorized API POST.
3. Create a challenge with no selected image, different default image, personal image, upload, and a missing default; verify server validation.
4. Register through both full page and modal; confirm redirect to Login and visible message; test invalid form and duplicate account.
5. Quiz all answered / some unanswered / none answered, cancel confirmation, Exit, and timer expiry.
6. Inspect 320/768/992/1200px widths, keyboard focus, notification stacking, carousel pause, Matrix cookie and reduced-motion preference.
7. Review create/update/delete consequences and all validation-error feedback throughout the SPA.

## Change history
All implementation commits were made directly on the requested `Salman-branch`. Source MVC repository is unchanged.


## Follow-up — Local API connection and Subapp 1-style Serilog (2026-11-05)

### Observed issue
The homepage displayed "Could not load featured challenges" on localhost. Source inspection found that `client/src/services/ApiClient.ts` and `client/src/services/AuthService.ts` interpolated `VITE_API_BASE_URL` without a fallback. The SPA repo had no tracked local `.env` file and its Vite server did not proxy API requests. Therefore a missing variable could produce requests to `undefined/api/...` instead of the ASP.NET Core backend. Browser network traces were not available to independently confirm the exact failing request.

### Changes and commits
- `c0a3034` — `fix(logging): align SPA Serilog file paths, output format and request IDs with MVC`. In `api/Program.cs`, log files now use the API content root's `Logs` directory, which is created explicitly, with timestamped per-run files. Console and file sink templates match Subapp 1 with timestamp, log level, source context, request ID, message, and exception. Middleware attaches `HttpContext.TraceIdentifier` to the log context.
- `3a23bb5` — `chore(logging): set Serilog information level and suppress noisy framework logs`. Added the same informational level and Microsoft.AspNetCore / EF Core warning-level overrides to `api/appsettings.json`.
- `497175c` — `fix(dev): proxy API and image requests from Vite to ASP.NET Core port 5116`. Vite dev server proxies `/api`, `/images`, and `/uploads` to `http://localhost:5116`, consistent with the API's `http` launch profile.
- `4116aa1`, `1124ff2` — `fix(client): use Vite same-origin API proxy when no base URL is configured`. Both shared `ApiClient.ts` and `AuthService.ts` now fall back to the empty string when `VITE_API_BASE_URL` is absent.

### Why
The relative-path logging setup was already present but depended on the shell's working directory, and the generated `Logs` folder was ignored by Git (as it should be). This update makes its location predictable and correlates API requests, controller actions, and DAL events. The Vite proxy avoids requiring a separate local environment file and prevents undefined request URLs.

### Local setup and verification
1. Update your local checkout: `git pull origin Salman-branch`.
2. If `client/.env` or `client/.env.local` already sets `VITE_API_BASE_URL`, ensure it uses the actual API address; for the new proxy setup, remove the variable for local development and restart Vite.
3. In terminal 1, run `cd api` and `dotnet run --launch-profile http`. Confirm `http://localhost:5116`. The backend still requires existing JWT user-secrets/environment configuration.
4. In terminal 2, run `cd client` and `npm run dev`. Visit `http://localhost:5173`.
5. Open `http://localhost:5116/api/challenges?filter=All` directly to isolate API failures. If the browser returns an HTTP 500 or errors in the backend terminal, investigate server/database issues separately.
6. Inspect `api/Logs/log-YYYYMMDD_HHMMSS.txt` after starting the backend and accessing an endpoint. `api/Logs` is ignored by Git and is intentionally not committed. Read it locally; avoid committing logs or secrets.

### Verification status
Repository modifications are committed. No local application instance, network trace, or build was executed through this GitHub connector. The user's previous successful builds were from before these new commits; rebuild and restart are required to verify this follow-up.
