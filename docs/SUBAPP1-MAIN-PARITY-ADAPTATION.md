# Subapp 1 main → Subapp 2 React/API parity adaptation

**Purpose:** Bring the functionality and group-meeting changes from the tested Subapp 1 MVC application into the separate Subapp 2 SPA **without replacing** the required React/Vite + ASP.NET Core Web API architecture.

## Immutable sources and scope

- Functional reference: [Subapp 1 main](https://github.com/Kenihski/GamificationPlatform/tree/main), reviewed at commit `db8ba1851c5fd09a813c9c2fae83dd9ac85eeddd` (26 November 2026).
- Subapp 2 integration base: `exam-readiness-audit-fixes` at `9c62db5d8ce9e6d6aab0997e342bf136eda748d5`.
- Working branch: `subapp1-main-parity-spa`.
- **Do not copy MVC Razor views or cookie session code directly into the SPA.** The Subapp 2 architecture must remain Vite/React/TypeScript, HTTP API endpoints, DTOs, JWT auth, async EF Core repositories and SQLite.
- Both repositories' `main` branches and the existing exam-readiness branch are preserved.

## Parity implemented in this branch

| MVC Subapp 1 behavior | SPA implementation | Verification |
| --- | --- | --- |
| Saving an unchanged question retains prior attempt history, scores, leaderboards | `api/Controllers/QuestionsController.cs` compares normalized metadata, options and accepted short answers before deleting history; `QuestionService.ts` and `EditQuestionPage.tsx` distinguish unchanged saves and display success feedback | Code integration; browser test pending |
| Saving a genuinely changed question resets prior challenge attempts | Existing question API logic retained | Code integration; browser test pending |
| Images used in questions cannot be deleted; warning links to the exact question | `UserImageController.cs` refuses DELETE with HTTP 409 and lists affected questions; `MyImagesPage.tsx` and `AdminImagesPage.tsx` show edit links | Code integration; browser test pending |
| Deleting an image used only as a challenge cover requires confirmation and switches that cover to Question 1 | New API deletion-impact endpoints, `confirmed=true` requirement, React confirmation dialogs with affected challenge titles | Code integration; browser test pending |
| Protect bundled Question 1 default image | Existing API fallback protection retained; admin React screen checks protected status | Code integration; browser test pending |
| Challenge creation defaults to Question 1 | Already present in the source SPA API and `CreateChallengePage.tsx` | Code review; browser test pending |
| Challenge update with empty image uses Question 1, not a broken/missing image | `ChallengesController.cs` update fallback and `EditChallengePage.tsx` default-image selection | Code integration; browser test pending |
| My Challenges → challenge details returns to My Challenges | `MyChallengesPage.tsx` provides route context, `ChallengeDetailsPage.tsx` selects the correct back link | Code integration; browser test pending |
| Admin-owned challenge Core/Community type management | Already present in `ChallengesController.cs`, `CreateChallengePage.tsx`, challenge details | Existing source; retest pending |
| Short-answer accepted answers shown in challenge management | Already present in `QuestionService.ts`, `ChallengeDetailsPage.tsx` | Existing source; retest pending |
| Navigation accessibility, focus-visible matrix toggle tooltip, wrapped navbar spacing | Existing React Router `NavLink` active-page states; updated matrix and navbar CSS; login form autofocus | Code integration; responsive/keyboard tests pending |
| Server logging, request/error handling and validation | Existing `api/Program.cs` Serilog, ProblemDetails, DTO Data Annotations, server authorization; previous SPA audit fixes preserved | Existing source; regression tests pending |

## Subapp 2 exam architecture retained

- **Frontend:** Vite + React/TypeScript, React Router, React-Bootstrap, TanStack Query; frontend services call the ASP.NET Core API. No Razor MVC pages are used to render the SPA.
- **Backend:** .NET 10 controllers under `api/Controllers`, DTO contracts in `api/DTOs`, repository interfaces and EF Core async DAL in `api/DAL`, domain models, SQLite persistence, identity/password hashing, JWT bearer authorization.
- **Relational CRUD:** Challenge, Question, Achievement, and other domain entities; relationships include user–challenge and attempt–selected-option associations.
- **Quality requirements:** client/server validation, authorization/ownership checks, request and domain logging, error handling, usable responsive UI.
- **Tests:** The course's minimum 12 backend unit tests (six positive/six negative) applies **only to Subapp 1**. Subapp 2 still needs successful build/lint verification and manual behavior checks, but no mandatory backend unit-test count.

## Build verification

The workflow `.github/workflows/subapp2-ci.yml` is configured to run on this branch and checks:

1. `dotnet build api/api.csproj --configuration Release`
2. `npm ci` from `client/`
3. `npm run build` from `client/`
4. `npm run lint` from `client/`

Check the workflow status for the **final commit** before describing build/lint as passed. The workflow does not exercise application behavior or replace browser testing.

## Manual regression plan: run incrementally

Use disposable accounts and challenges only; restart of the Development API re-creates the SQLite database.

1. **Connectivity and authentication:** configure `Jwt:Key` (User Secrets), launch API on 5116 and Vite on 5173, log in/register as user and admin, verify protected routes and errors.
2. **Question history:** create a challenge with three question types, submit an attempt, save each question unchanged (history stays), then modify title/choice/correct option/short accepted answer (history resets).
3. **Image protection:** upload an image, attach to a question, attempt deletion (must be refused with edit link). Attach a different image only as a challenge cover; cancel and confirm deletion (fallback to Question 1).
4. **Default images:** verify protected Question 1 cannot be deleted; temporary new default image can be deleted only after confirmation.
5. **Challenge forms:** initial Question 1 preview on Create, switching image sources on Create/Edit, changed image persistence, invalid fields rejected on both frontend and API, non-admin cannot create Core.
6. **Navigation:** My Challenges/View/back, public Challenges/View/back, direct URL, browser history, active sidebar links, 375px/768px/1280px focus and overflow.
7. **Authorization:** owner versus other standard user versus admin for questions, challenges, images, achievements and change-type actions; direct API requests must enforce roles.
8. **Quiz and results:** no-answer confirmation, time limits, first/best attempt scoring where supported, achievements and leaderboards; verify draft visibility and publishing restrictions.
9. **Error/logging:** invalid paths, missing IDs, invalid upload, simulated API disconnection, user-safe errors, Serilog logs without secrets.
10. **Delivery:** repeat Release API build, npm production build and lint; verify Git clean status excluding runtime files, and test examiner setup from a fresh ZIP.

## Known differences and limitations

- Subapp 1 is a server-rendered MVC/Razor application using cookie sign-in; Subapp 2 intentionally remains a React SPA using API DTOs and JWT. Their route names, form submission lifecycle and DOM markup are **not expected to match**.
- Subapp 2 has its own migrations/SQLite database; **do not copy the tracked Subapp 1 database or MVC migrations into the SPA**.
- Image-deletion confirmation is adapted to a React dialog rather than the MVC Razor confirmation page, with a separate API preview endpoint and a required confirmation flag.
- The Development API reset/reseed behavior and JWT configuration remain as documented in `docs/EXAMINER-SETUP-SUBAPP2.md`.
- A passing CI build is **not** proof of behavioral parity. Record manual tests separately before presenting this branch as exam-ready.
