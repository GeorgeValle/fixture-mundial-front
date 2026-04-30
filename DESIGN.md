# Design System Guide

## Purpose

`DESIGN.md` is the source of truth for the visual identity, UI consistency, and reusable design decisions of `fixture-mundial-front`.

Use this guide before changing global styles, shared components, page layouts, visual states, or reusable UI patterns. It complements the page-specific documents in `docs/*.md`: this file defines how the app should look and feel, while each page document defines page behavior and functional requirements.

## Visual Identity

The app should feel like a modern football fixture experience built for a portfolio project:

- A football-first schedule and prediction app, not a generic dashboard.
- Sporty, energetic, and tournament-inspired without becoming noisy.
- Clean and readable enough for fixture data, standings, brackets, and predictions.
- Custom visual identity created with CSS, spacing, cards, color, and subtle field references.
- No official FIFA branding, protected logos, mascot, trophy, official ball design, or copied tournament assets.

## Design Principles

- Clarity before decoration: match data, dates, scores, states, and navigation must be easy to scan.
- Reusable components before duplicated styles: shared UI patterns should live in shared components and CSS Modules.
- Subtle football references: use field lines, pitch textures, cards, badges, and motion sparingly.
- Readable contrast: decorative gradients and pseudo-elements must never reduce legibility.
- Mobile-first responsiveness: layouts should stack and remain usable on small screens first.
- CSS Modules are the styling standard for components and pages.
- Global CSS should stay minimal and limited to tokens, reset/base styles, and app-wide defaults.
- Visual variants should be intentional, named through props/classes when needed, and documented here when they become reusable.

## Color Direction

The current color direction is a custom tournament-inspired palette:

- Deep navy / dark blue base for primary text, headers, and strong surfaces.
- Green field-inspired accents for football context.
- Red accent for energy and important emphasis.
- Cyan / light blue for highlights, glows, and interactive freshness.
- Yellow-card inspired menu surface for the navbar dropdown identity.
- Light surfaces for readable cards and content sections.

Use existing CSS custom properties when possible instead of hardcoding new values. Current global variables live in `src/index.css` and include:

- `--color-bg`
- `--color-surface`
- `--color-surface-soft`
- `--color-primary`
- `--color-primary-soft`
- `--color-red`
- `--color-cyan`
- `--color-magenta`
- `--color-gold`
- `--color-green`
- `--color-text`
- `--color-muted`
- `--color-border`
- `--color-glass`

Do not introduce new global color tokens unless the color will be reused across multiple components or pages.

## Typography

- Use clear hierarchy: page titles, section titles, card titles, metadata, and helper copy should be visually distinct.
- Headings should be readable and confident, not overly decorative.
- Metadata such as date, stadium, group, status, and helper labels should be compact but legible.
- Match data should be easy to scan at a glance.
- Avoid decorative font choices that make scores, team names, or table values harder to read.
- User-facing copy may be Spanish; technical names, file names, and component names remain English.

Existing global sizing variables in `src/index.css` include:

- `--font-size-xs`
- `--font-size-sm`
- `--font-size-md`
- `--font-size-lg`
- `--font-size-xl`
- `--font-size-2xl`
- `--font-size-3xl`

## Spacing, Radius and Shadows

Use spacing, radius, and shadow consistently so the app feels cohesive:

- Cards should generally be rounded and spacious.
- Use soft shadows to create hierarchy without heavy visual noise.
- Maintain clear internal spacing between headings, metadata, actions, and content.
- Avoid cramped layouts, especially in match cards and standings tables.
- Keep consistent gaps between sections, cards, lists, and controls.
- Prefer existing spacing/radius/shadow variables before adding new values.

Existing global variables in `src/index.css` include:

- Spacing: `--space-1`, `--space-2`, `--space-3`, `--space-4`, `--space-5`, `--space-6`, `--space-8`, `--space-10`, `--space-12`
- Radius: `--radius-md`, `--radius-lg`, `--radius-pill`
- Shadows: `--shadow-soft`, `--shadow-card`

## Component Design Rules

- Shared components must carry reusable visual language and should not be styled as one-off page fragments.
- Page-specific components may add layout and context, but should not duplicate base component styles unnecessarily.
- Shared components should expose intentional variants only when the same visual need appears in more than one place.
- Keep API calls and backend-specific logic out of presentational components.
- Prefer composition: page sections arrange shared components; shared components handle their own visual structure.
- CSS-only decorative elements should stay inside the relevant component module.
- If a visual decision becomes reusable across pages, update this file.

## Match Card Design Direction

`FixtureMatchCard` is the shared base component for match presentation.

Approved direction for future match cards:

- The card may evolve into a subtle football-field inspired layout.
- It can use CSS-only field lines, including:
  - center line
  - center circle
  - side penalty areas
  - subtle background field texture
- Team information must remain readable above the field design.
- Score and status should remain central and visually dominant.
- Date, stadium, city, group, and match metadata should remain compact and easy to scan.
- The field effect must be subtle and must not reduce contrast.
- Decorative layers must not block pointer events.
- The design should be reusable across Home, Group Fixtures, Knockout Stage, and Prediction Fixture when appropriate.
- Avoid creating separate match-card designs per page unless there is a clear and documented reason.

Do not implement the match-card rework until it is explicitly approved as a task.

## Page-Level Design Rules

- Home keeps the hero as the main presentation section.
- Home daily schedule appears below the hero and before informational sections.
- Group Fixtures uses reusable match cards and should prioritize fixture scanning by group.
- Group Standings should prioritize readable tables/cards over decorative complexity.
- Knockout Stage should prioritize bracket clarity, placeholder readability, and progression structure.
- Prediction Fixture should prioritize interaction clarity, locked/editable states, and score feedback.
- Page-level decoration should support the content, not compete with it.
- Page-specific behavior and backend details belong in the corresponding `docs/*.md` file, not here.

## Loading, Empty and Error States

- Use existing skeleton loaders for backend-powered content.
- Loading states should resemble the final card/table shape when possible.
- If loading is delayed, use the existing friendly feedback modal pattern.
- Empty states should explain what happened and what the user can expect next.
- Error states must be user-friendly and visually consistent.
- Do not expose raw backend errors, stack traces, Axios objects, or technical payloads to users.
- Technical details may be logged only through the approved error handling flow.

## Responsive Rules

- Design mobile-first, then enhance for wider screens.
- Cards should stack cleanly on small screens.
- Lists should preserve readable spacing and avoid horizontal overflow.
- Tables may need horizontal scroll, reduced columns, or a responsive card format depending on the page.
- Navigation must remain accessible on mobile.
- Touch targets should be comfortable for buttons, menu controls, selectors, and interactive match inputs.
- Avoid layout assumptions that only work at desktop width.

## Accessibility Rules

- Maintain sufficient color contrast for text, metadata, scores, buttons, and links.
- Preserve visible focus states for keyboard navigation.
- Use semantic buttons for actions and semantic links for navigation.
- Use useful `alt` text for shields, flags, or team images.
- Decorative CSS elements should be hidden from assistive meaning by being purely visual.
- Decorative pseudo-elements must not capture pointer events.
- Do not place overlays above controls unless the controls remain clickable and focusable.
- Keep labels visible or programmatically associated with form controls.

## Asset Rules

- Do not use official FIFA logos, mascot, trophy, official ball design, official tournament marks, or protected branding.
- Prefer CSS-only decorative football elements when possible.
- External assets must be intentional, legally safe, and documented by their usage context.
- Flags and shields should come from backend-provided URLs when available; do not commit team flag/shield image assets to the repository.
- Avoid adding heavy visual assets when CSS can achieve the effect.

## Maintenance Rules

- Update `DESIGN.md` when a new global visual decision is approved.
- Do not put page-specific backend logic here.
- Do not duplicate long implementation history here.
- Keep detailed page behavior in the corresponding `docs/*.md` file.
- Keep `docs/task.md` as a checklist only.
- If a component-specific visual rule becomes global, move the rule here and keep the page document focused on page behavior.
