# Subapp 2 — examiner setup and verification

This guide applies to the ASP.NET Core 10 Web API + React/Vite Subapp 2 in the submitted ZIP. It is independent of Subapp 1 and uses a separate SQLite database.

## Requirements

- .NET 10 SDK
- Node.js 24 and npm
- A writable, extracted copy of the project, with the `api/` and `client/` folders intact

## 1. Configure the JWT key

The API requires `Jwt:Key`. The issuer and audience are already defined in `api/appsettings.json`. **Do not commit a reusable JWT secret to GitHub or put it in screenshots.** For this local exam demo, generate a fresh random 32-byte key and store it using .NET User Secrets. Run from the `api` directory.

**Windows PowerShell:**

```powershell
cd api
$key = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
dotnet user-secrets set "Jwt:Key" "$key"
dotnet user-secrets list
```

**macOS / Linux (requires OpenSSL):**

```bash
cd api
dotnet user-secrets set "Jwt:Key" "$(openssl rand -base64 32)"
dotnet user-secrets list
```

The generated value is stored in the machine's local development secret store, **not** the repository. The included `api.csproj` supplies the project's UserSecretsId.

For other environments, provide `Jwt__Key` as a base64-encoded environment variable of at least 32 random bytes. Production hosting also needs HTTPS, correct API routing, and secure secret distribution.

## 2. Run the ASP.NET Core API

From `api/`:

```bash
dotnet restore
dotnet build --configuration Release
dotnet run --launch-profile http
```

Confirm the console says the API is listening on `http://localhost:5116`. Open:

`http://localhost:5116/api/challenges?filter=All`

You should receive a JSON array, not a 500 error. If the API exits before listening, check the terminal for JWT settings, migration/seed problems, or file permissions.

## 3. Run the React SPA

Open a **second terminal** in `client/`:

```bash
npm ci
npm run build
npm run dev
```

Open `http://localhost:5173`. **For the supplied local development setup, leave `VITE_API_BASE_URL` unset.** Vite proxies `/api`, `/images`, and `/uploads` to `http://localhost:5116`, so no additional `.env` file is needed. An existing `client/.env.local` with a stale `VITE_API_BASE_URL` can override the proxy and cause connection failures.

If the proxy fails: open Developer Tools > Network, check the HTTP status for `/api/challenges`, verify the API is still listening on 5116, and restart Vite after changing environment variables.

The Vite development proxy does **not** run when serving built `dist/` assets separately. For a deployed build, configure a reverse proxy or an appropriate `VITE_API_BASE_URL` and CORS policy.

## 4. Demo credentials

In the Development environment, the database is seeded with an administrator account `admin` and standard accounts `Alice`, `Bob`, `Charlie`, `Emma`, `David`, `Freya`, `George`, `Hannah`, `Isaac`, `Julia`, and `Kevin`. The development-only password is `Password123!`. Only `admin` has the Admin role. Do not reuse these demo credentials in a public deployment.

**Data-loss warning:** `api/DAL/DBInit.cs` calls `EnsureDeletedAsync()` and then `MigrateAsync()` in Development mode. Restarting the API therefore **deletes all prior local database changes**, including newly registered accounts, quiz results, and created challenges, before recreating seeded demo data. This is intended only for the disposable exam demo; it is not durable production persistence. Existing uploaded files may need separate cleanup.

## 5. Verify functionality

- Guest: list/search/filter published challenges, inspect leaderboard and Hall of Fame.
- Standard user: login, create/edit/delete a challenge, add/edit/delete questions, publish only after adding a question, take a quiz, see results/attempts and achievements.
- Admin: create/manage achievements, inspect users, moderate challenges, and change type of an admin-owned challenge.
- Negative checks: invalid/missing fields, duplicate username, forbidden cross-owner operations, empty challenge publication, invalid question options, invalid image upload.
- Failure behavior: turn off the API while browsing the SPA; a visible request error should appear without a page crash. Restart and retry.
- Check `api/Logs/log-*.txt` after the API starts. The folder is generated at runtime and intentionally not committed.
- Check browser console/network and run desktop/mobile/keyboard-accessibility scenarios.

## 6. Automated verification

The repository workflow `.github/workflows/subapp2-ci.yml` builds the API, installs locked npm dependencies, builds/lints the SPA, checks an API endpoint and exercises Vite's development proxy. Review the **actual GitHub Actions result for the submitted commit**; the workflow definition alone is not evidence of a passing run.

This project does not claim to have the 12-backend-unit-test suite in Subapp 2; that exam requirement applies specifically to Subapp 1.
