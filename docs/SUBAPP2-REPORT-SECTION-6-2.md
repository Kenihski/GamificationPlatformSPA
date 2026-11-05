# Subapp 2 — report-ready Section 6.2 and verification matrix

**Scope:** Subapp 2 (ASP.NET Core 10 API + React/Vite SPA). This section supplements the team report's Section 6.2. Statements labelled *implemented* are based on code inspection. They must not be presented as successfully browser-tested until the check is recorded on the final submission commit.

## 6.2 Input validation, error handling and logging

### Input validation

**Server-side (implemented).** ASP.NET Core API controllers use `[ApiController]`, DTOs and Data Annotations to reject invalid HTTP request bodies. `api/DTOs/RegisterDTO.cs` uses `[Required]`, `[EmailAddress]`, `[StringLength]`, `[Compare]` and `IValidatableObject` to enforce registration constraints. `api/Controllers/QuestionsController.cs` validates question types, option counts, duplicate/empty choices, correctness selections and accepted short answers before saving. `api/Controllers/ChallengesController.cs` checks allowed image ownership, challenge visibility/ownership, and prevents publishing a challenge without questions. `api/Controllers/AchievementController.cs` checks achievement type, point values, requirement boundaries, and blocks editing/deleting system goals. Unauthorized changes are rejected server-side even if frontend restrictions are bypassed.

**Client-side (implemented).** React forms provide validation and submission feedback. The shared `client/src/services/ApiClient.ts` wraps `fetch`, sends JWT bearer tokens and extracts API `ValidationProblemDetails.errors` into readable messages. `client/src/services/AuthService.ts` handles registration/login responses. Client checks improve immediate feedback, while the API remains authoritative. During functional verification, bypass the client-side restrictions and confirm the API still rejects invalid submissions.

### Error handling and resilience

**API (implemented).** `api/Program.cs` registers `AddProblemDetails()` and a centralized `UseExceptionHandler`. Unexpected errors are logged with exception and request context and return HTTP 500 with a generic JSON `ProblemDetails` message rather than a server stack trace. Expected validation, authentication and authorization failures result in appropriate 400-series responses. Controllers and DAL repositories also log significant actions and errors.

**React (implemented).** The API client's failed-request handling differentiates 401 (expired authentication), 403 (permission denied), structured validation errors, and generic 500-level failures. Feature pages render loading and error states using React/TanStack Query. Actual browser behavior during API downtime must be demonstrated; source-level patterns do not guarantee every possible page handles network failures identically.

### Logging

**Server-side (implemented).** `api/Program.cs` registers Serilog console and file sinks and ensures `api/Logs` exists at runtime. Every run creates `log-YYYYMMDD_HHMMSS.txt`. Messages include timestamp, level, source context, request identifier, message and optional exception information. A middleware scope attaches `HttpContext.TraceIdentifier` to support correlation with controller and repository messages. `UseSerilogRequestLogging` captures HTTP request completion; repository failures use `ILogger`. `api/appsettings.json` configures information-level application logs and reduces framework/EF Core noise.

**Security implications.** Deliberate log messages avoid passwords and raw credentials. Review final logs to confirm no sensitive user data appears unexpectedly. JWT signing keys are supplied via User Secrets or environment variables, not committed settings. Frontend JWT storage in `localStorage` is a documented XSS-related trade-off; authorization is still enforced by the API.

### Verification and limitations

The code features listed above are **implemented**. They are **not marked manually passed** here. The repository workflow `.github/workflows/subapp2-ci.yml` runs the Release API build, SPA production build and ESLint. It performs no automated application tests. Record build output for the final commit. The development database is recreated at every API startup by `api/DAL/DBInit.cs`; tests requiring persistent test changes across restarts must account for this.

## Subapp 2 functional verification checklist — record before submission

| ID | Scenario | Expected outcome | Result |
| --- | --- | --- | --- |
| SPA-01 | Fresh ZIP: configure JWT and run API | API starts without an unhandled exception, `/api/challenges` responds with JSON | Not yet recorded |
| SPA-02 | Start Vite client with `VITE_API_BASE_URL` unset | Home/challenge lists and images load through proxy | Not yet recorded |
| SPA-03 | Register valid user; log in; log out | Success and safe authenticated navigation | Not yet recorded |
| SPA-04 | Duplicate username, bad email, password mismatch | Client messages and API validation rejection | Not yet recorded |
| SPA-05 | Challenge Create/Read/Update/Delete | Changes reflected in UI and database | Not yet recorded |
| SPA-06 | Question Create/Read/Update/Delete for all types | Accurate input rules, no invalid writes | Not yet recorded |
| SPA-07 | Admin Achievement Create/Read/Update/Delete | Admin manages normal achievements; system goals protected | Not yet recorded |
| SPA-08 | Attempt publishing a challenge with zero questions | Clear rejection; challenge remains unpublished | Not yet recorded |
| SPA-09 | Normal user attempts another user's update / Core change | HTTP 403 or appropriate safe rejection; no mutation | Not yet recorded |
| SPA-10 | Submit quiz with none, some and all answers | Appropriate confirmation and correct results | Not yet recorded |
| SPA-11 | Timed quiz expiry, second attempt, score/ranking rule | Correct time handling and first-attempt leaderboard behavior | Not yet recorded |
| SPA-12 | Invalid image type, large file, cross-owner image | Rejected with safe feedback | Not yet recorded |
| SPA-13 | API stops while React is open | Visible network error; no uncaught UI crash | Not yet recorded |
| SPA-14 | Generate 400/403/404 and controlled 500 | Safe responses; relevant log entries with correlation IDs | Not yet recorded |
| SPA-15 | Keyboard, reduced motion, 320/768/992/1200px widths | Usable navigation, accessible errors, no critical overflow | Not yet recorded |
| SPA-16 | Restart API after creating data | Database reset matches documented development behavior | Not yet recorded |
| SPA-17 | Final ZIP on a clean machine | Documented startup and demo logins are reproducible | Not yet recorded |

### Evidence to add to the final team report

For each executed test, record **date, tested commit/ZIP, account/role, expected result, actual result, Pass/Fail, and evidence reference** (screenshot, log excerpt or browser Network record). Report failures rather than replacing them with inferred success. No automated tests are required for Subapp 2. The mandatory 12 backend unit tests apply exclusively to Subapp 1; the scenarios above are suggested manual functional verification, not a unit-test suite.

## Related references

- `docs/EXAMINER-SETUP-SUBAPP2.md` — step-by-step setup, JWT configuration, development-reset warning, proxy behavior, demo credentials
- `docs/SPA-Logging-Validation-Freyr-UX-Implementation.md` — implementation history (not proof of runtime testing)
- `api/Program.cs`, `api/Controllers/`, `api/DTOs/`, `api/DAL/`
- `client/src/services/ApiClient.ts`, `client/src/services/AuthService.ts`, `client/src/challenges/`
