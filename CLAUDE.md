# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at localhost:8080
npm run build     # Production build (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Preview production build
```

There are no automated tests in this project.

### Supabase Edge Functions (Deno)

Edge functions live in `supabase/functions/` and run in Deno. To deploy all functions:
```bash
SUPABASE_ACCESS_TOKEN=<token> supabase functions deploy --project-ref fkvfngdwblbalrompzdj
```

To deploy a single function:
```bash
SUPABASE_ACCESS_TOKEN=<token> supabase functions deploy <function-name> --project-ref fkvfngdwblbalrompzdj
```

The token is in `.env` as `SUPABASE_ACCESS_TOKEN`. Use `--project-ref` instead of `supabase link` — it works without an interactive terminal.

## Architecture

**Primrose Pathfinder** is a college application management platform for high schools. It supports five roles: Student, Counselor, Parent, Principal, Admin.

### Frontend (React + Vite + TypeScript)

- **Routing**: React Router v6 defined in `src/App.tsx`. `ProtectedRoute` wraps role-gated pages.
- **Auth**: `useAuthState` hook (`src/hooks/useAuthState.ts`) is the source of truth for the current user and their role.
- **Navigation**: `src/components/AppSidebar.tsx` conditionally renders nav items per role.
- **Server state**: TanStack React Query throughout. Direct Supabase client calls happen in custom hooks under `src/hooks/`.
- **Role preview**: `PreviewModeContext` (`src/contexts/PreviewModeContext.tsx`) lets counselors/principals preview the student experience.
- **UI**: shadcn/ui + Radix UI primitives, Tailwind CSS. Base components are in `src/components/ui/`.

### Backend (Supabase)

- **Database**: PostgreSQL via Supabase. Key tables: `profiles`, `essays`, `essay_feedback`, `applications`, `recommendation_requests`, `messages`, `tasks`, `onboarding_answers`.
- **Edge Functions**: 22 Deno functions in `supabase/functions/`. Invoked from the frontend via `supabase.functions.invoke()`.
- **Auth**: Supabase Auth (email/password). Role stored in `profiles.role`.
- **Secrets**: `ANTHROPIC_API_KEY2` is the Anthropic API key stored in Supabase secrets.

### AI Integration

All AI calls go through Supabase Edge Functions — never directly from the browser. The shared AI wrapper is at `supabase/functions/_shared/ai-client.ts`.

- **Primary model**: `claude-sonnet-4-20250514`
- **Fallback**: Gemini (configured in `ai-client.ts`)
- **Prompt caching**: Enabled for system prompts to reduce latency and cost
- **Rate limiting**: `supabase/functions/_shared/rate-limiter.ts` — 10 calls/min for generation, 20/min for analysis, enforced per user

Key AI functions:
| Function | Purpose |
|---|---|
| `analyze-essay` | Scores essays on 5 criteria + detailed feedback |
| `generate-personal-statement` | Creates essays from onboarding Q&A answers |
| `coach-essay-section` | Section-level writing guidance |
| `student-ai-helper` | General writing assistance in Primrose Lab |
| `enhance-recommendation` | Improves recommendation letter drafts |
| `scholarship-match` | Matches students to scholarships |
| `evaluation-engine` | Evaluates student application profile |

### Key Data Flows

**Essay feedback flow**: Student submits essay → counselor opens feedback modal → calls `analyze-essay` edge function → Claude returns structured scores + comments → counselor adds manual notes → saved to `essay_feedback` table. Hooks: `useEssayFeedback`, `useEssayAnalysis`.

**Onboarding flow**: Student completes multi-step questionnaire (`src/data/onboardingSteps.ts`) → answers stored in `onboarding_answers` → `generate-personal-statement` function creates a draft personal statement.

**Recommendation letters**: Student requests via application flow → teacher receives token-based link → completes letter → stored and tracked in `recommendation_requests`.

### TypeScript Config

`tsconfig.json` uses loose settings: `noImplicitAny: false`, `strictNullChecks: false`. Don't tighten these — it will break the build across many files.

### Deployment

Deployed to Vercel. Config in `vercel.json`. All routes rewrite to `index.html` for SPA routing.
