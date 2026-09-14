# Zoo feature components
- Keep the established CSS classes, color palette and Liu Kanshan assets.
- `primitives.tsx`: mascot, avatars, headings and Skill cards.
- `explore.tsx`, `incubator.tsx`, `habitat.tsx`, `exchange.tsx`, `colab.tsx`: feature views.
- `skill-detail.tsx`: details, access control and contribution review entry.
- `app.tsx`: shell, navigation, dialogs and notifications.
- Domain logic lives in `lib/`; components must not invent verification counts or backend success.
- Use explicit labels and native controls; preserve reduced motion and narrow-screen support.
