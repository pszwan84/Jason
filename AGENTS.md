# Skill Zoo workspace rules

## Scope and preservation
- The active application is `skill-zoo/`; product and delivery documents live in `docs/`.
- Preserve all pre-existing uncommitted work. Do not delete files, rewrite Git history, push, deploy, modify credentials, hidden configuration, or database schemas without the user's explicit approval.
- Keep the current visual language and Liu Kanshan assets. Demo state must be clearly distinguished from real multi-user collaboration or model generation.
- Document substantial changes in `docs/DEMO-DELIVERY-PLAN.md` and obtain the user's agreement before implementing them.

## Structure
- `skill-zoo/app/`: route entries, layout, global styles.
- `skill-zoo/components/`: reusable UI and feature components; `ui/` contains existing component primitives.
- `skill-zoo/lib/`: typed domain models, deterministic business logic, persistence and demo fixtures.
- `skill-zoo/tests/`: domain tests and browser verification scripts; descriptive English filenames.
- `docs/`: PRD, implementation status, delivery plan and reproducible demonstration instructions.
- `D:/资料/AI产出/skill-zoo-delivery-20260914/`: session-specific logs, screenshots and review artifacts; define its rules before writing artifacts.
- Keep existing files unless the user authorizes removal. Do not put generated artifacts in the user home directory.

## Verification
- Baseline commands: `npm run lint`, `npx tsc --noEmit`, `npm run build` in `skill-zoo/`.
- Add reproducible `typecheck` and `test` scripts using existing dependencies or Node's built-in test runner.
- Verify the demonstration path with a real browser: create, distill, edit, publish, find, exchange, review, co-create and reload.
- Verify mobile layout, browser errors, invalid inputs and storage failures where relevant.
- Update README and delivery documentation to match only behavior actually implemented and verified.
