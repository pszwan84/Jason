# Skill Zoo demo delivery plan

## Verified baseline — 2026-09-14
- Repository: `D:/资料/项目与代码/Jason`, application: `skill-zoo/`.
- Branch: `feature/skill-zoo-ui`; HEAD and remote feature branch: `17d86f64f177ec669a7fad086fc42cfb9df93c8f`.
- Existing working changes are retained. The claimed separate server MVP is not present in the inspected tree or remote heads.
- Runtime: Node v24.14.0, npm 11.9.0. Dependencies are already installed.
- Existing implementation uses deterministic extraction and browser-local persistence. It has no authenticated multi-user backend.

## Baseline work completed
- Added repository structure and preservation rules in `AGENTS.md`.
- Added `npm run typecheck` and `npm test` without installing dependencies.
- Four tests pass: experience extraction, blank input, serializable field filtering, and persistence roundtrip/failure reporting.
- Typecheck and all five production-build stages pass.
- Lint baseline: 28 errors across the page and existing UI primitives; not yet fixed.
- Existing trailing blank-line findings remain in the root README and global styles. Typecheck generated `skill-zoo/tsconfig.tsbuildinfo`; retain it locally and do not include it in a commit.
- The user approved implementation with “实施”. The local demo scope below is authorized; server/database/deployment remain outside scope.
- Domain foundation is now implemented and tested in `skill-zoo/lib/model.ts`, `lib/domain.ts`, `lib/fixtures.ts`, `lib/storage.ts`, `lib/zoo-store.ts`, `lib/navigation.ts` and `lib/bilateral-match.ts`.
- The legacy `app/page.tsx` remains the active visual shell. New feature components (`components/zoo/`) are isolated and typecheck, but are not yet mounted as the primary page flow; do not claim the full browser lifecycle is delivered until that integration is complete.

## Delivery scope — approved by the user on 2026-09-14
Deliver an offline-capable, single-browser demo with the existing six-screen visual design. Present local persistence, sample data, rules-based extraction and simulated counterpart approval accurately.

1. Establish repeatable typecheck, domain tests, lint and production-build checks without new global dependencies.
2. Separate domain types, sample fixtures and key feature components from the oversized page incrementally, preserving current user changes and visuals.
3. Repair the full local lifecycle: input → editable five-step draft → published Skill → searchable detail; retain fields after refresh.
4. Implement the PRD's bilateral supply-demand scoring with visible inputs, weights and explanations; describe scores as demo ranking scores rather than calibrated probabilities.
5. Save complete exchange-card form data, bind cards to skills, enforce explicit simulated review and openness rules, and carry accepted exchanges into tasks and derived Skill lineage.
6. Add URL-backed screen/detail navigation, functional browser back/forward, useful empty states, and storage recovery/error feedback without silently destroying user data.
7. Verify a complete demonstration and mobile layout. Deliver an honest README, a short demonstration script, limitations and remaining server work.

## Out of scope for this proposal
- Authentication, shared server data, database schemas/migrations, model/API credentials, cloud services or public deployment.
- Unverified teammate code, fabricated claims of real AI generation or messages sent to another user.
- Git push or deletion. A local checkpoint commit may be prepared after validation; stage only reviewed task files.

## Acceptance
- Typecheck, domain tests, lint and build succeed, with any unavoidable baseline issue documented accurately.
- Real browser verification passes publishing, filtering, exchange review, gated access, co-creation and refresh persistence.
- Direct navigation and browser history work, keyboard controls have accessible names, and narrow screens do not overflow.
- The demo can be started using documented commands without API keys.
