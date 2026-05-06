# Block 10 — Onboarding, Navbar and Progressive UI Polish

## Objective

Improve the first-run experience and navigation clarity while keeping the existing visual identity intact. Block 10 is implemented in separate Build Mode parts to avoid a broad redesign.

## Current implementation status

### Part 1 — Onboarding, Navbar and SVG Assets

Status: implemented and manually validated by the user.

Implemented scope:

- Home onboarding tutorial for first-time visitors.
- Manual tutorial reopen from the Navbar.
- Navbar ball icon replaced with the project SVG asset.
- Whistle SVG used for the tutorial/help button.
- Stadium illustration asset normalized to lowercase filename for consistency.
- Tests added for tutorial persistence, manual reopen, Navbar accessibility state and storage behavior.

### Part 2 — Home, Group Fixtures and Standings Refinement

Status: implemented and manually validated by the user.

Implemented scope:

- Home quick links: the Home chips were converted into real React Router links to `/grupos`, `/posiciones`, `/eliminatorias` and `/predicciones` while preserving `data-tour="home-sections"` for the onboarding step.
- Home hero refinement: the hero keeps the existing layout and copy direction, improves visual balance around the CTA pills, and uses `src/assets/illustrations/soccer-football-stadium.svg` as a subtle decorative watermark with `alt=""` and `aria-hidden="true"`.
- Group Fixtures top panel refinement: `/grupos` now presents a stronger group control panel with the title, intro copy, favorite group control, selector, match count, detected selections, available venues and chronological summary derived from existing match data. Incomplete match data falls back to safe labels such as `Por confirmar` and `Fechas por confirmar`.
- Group Standings control panel refinement: `/posiciones` now has a clearer control panel explaining `Vista general` and `Vista foco`, keeps `aria-pressed` on both view buttons, keeps the selector accessible, and adds selected-group context without changing standings calculations or backend contracts.

Tests added or updated:

- Home quick links are accessible by role/name and expose the expected `href` values.
- The Home tutorial target `data-tour="home-sections"` remains present after converting chips to links.
- Group Fixtures still honors the favorite group initial selection and now covers safe summary rendering for incomplete match data.
- Group Standings keeps the existing view-mode switch behavior and `aria-pressed` checks, with added coverage for the new help copy and selected-group indicator.

Part 3 was implemented separately and did not change the Part 2 scope except for documentation status.


### Part 3 — Knockout, Predictions, Consistency and Tests

Status: implemented and validated with final automated QA.

Implemented scope:

- Knockout refinement: `/eliminatorias` now presents the section as `Camino a la final`, with clearer status badges, a more visual `Equipos por definir` state, and a stronger round-control panel.
- Knockout round controls: the existing select remains available and accessible, and desktop/tablet-friendly round chips were added for `Todas las rondas`, `Dieciseisavos de final`, `Octavos de final`, `Cuartos de final`, `Semifinales`, `Partido por el tercer puesto` and `Final`. Chips and select use the same `selectedRound` state and preserve `aria-pressed` on the buttons.
- Knockout cards/rounds: round headers and match cards received moderate visual polish for badges, pending states, metadata, teams by definition and result pending states. No teams, qualifiers, results or bracket progression were invented.
- Prediction refinement: `/predicciones` now reads as `Tu tablero de predicciones`, with dashboard-style hero context, participant setup panel, refined summary cards, progress bars for available prediction counts, printable summary CTA and clearer filter panels.
- Prediction danger zone: reset controls are now presented as `Zona de borrado` with clearer copy explaining that only editable predictions stored in the current browser are removed and locked predictions are preserved.
- Controlled consistency pass: Part 3 aligned badges, chips, small labels, card spacing, focus states and metadata only inside `/eliminatorias`, `/predicciones` and their related components. It did not redesign the whole app.

Tests added or updated:

- Knockout header/copy now verifies `Camino a la final`.
- Knockout round chips are accessible by role/name, synchronize with the select, and preserve selected state through `aria-pressed`.
- Existing knockout tests still verify skeleton fallback, teams by definition, no technical skeleton keys and no invented progression.
- Prediction tests cover dashboard copy, participant setup copy, printable CTA, danger-zone copy and updated summary labels.
- Existing prediction tests still cover filters, print behavior, localStorage, locking, scoring, reset behavior and closed knockout prediction state.

Not implemented in Part 3:

- No visible penalty prediction fields for knockout ties.
- No opening of knockout prediction inputs while the real knockout prediction flow remains unapproved.
- No backend contract changes.
- No new dependencies.


## Final QA status

Final QA for Block 10 passed.

Validated scope:

- Main routes reviewed: `/`, `/grupos`, `/posiciones`, `/eliminatorias`, `/predicciones` and the `*` 404 fallback route.
- Part 1 checks reviewed: first-visit tutorial behavior, manual tutorial reopen, Navbar ball menu accessibility, overlay coordination and scroll-restoration safeguards.
- Part 2 checks reviewed: Home quick links, Group Fixtures favorite/selector/safe summary, and Standings general/focus controls with `aria-pressed`.
- Part 3 checks reviewed: Knockout round chips/select synchronization, honest pending-team/result states, Predictions dashboard controls, print, reset, filters, localStorage, scoring and locking coverage.
- Documentation updated to mark Block 10 closed.

Automated validation:

- `pnpm run build` passed.
- `pnpm run lint` passed.
- `TMPDIR=/tmp TEMP=/tmp TMP=/tmp pnpm run test` passed.


## Approved assets

Final asset paths after Part 1:

- `src/assets/icons/soccerballnoshadow.svg`
- `src/assets/icons/silbato-web.svg`
- `src/assets/illustrations/soccer-football-stadium.svg`

The SVGs used inside buttons are decorative and must be paired with accessible button labels. Decorative SVGs must use `alt=""` and/or `aria-hidden="true"`.

## Onboarding behavior

The Home tutorial is intentionally simple and stable:

- It appears automatically on the first Home visit when the local seen flag is missing.
- It uses an overlay, guided panel and approximate spotlight states instead of fragile DOM measurement.
- It includes these controls: `Atrás`, `Siguiente`, `Omitir` and `Finalizar`.
- `Omitir`, `Finalizar` and `Escape` mark the tutorial as seen.
- It can be reopened manually from the Navbar with the `Ver tutorial` button.
- Tutorial open state lives in Redux UI state as serializable data only; callbacks are not stored in Redux.

Storage key:

- `fixtureMundial.homeTutorialSeen`

## Public copy approved in Part 1

Tutorial steps:

1. `Bienvenido al fixture` — `Acá podés seguir partidos, tablas, eliminatorias y tus predicciones del Mundial 2026.`
2. `Abrí el menú desde la pelota` — `Tocá la pelota para desplegar las secciones principales de la app.`
3. `Explorá por secciones` — `Estos bloques te presentan cada sector de la experiencia: fixture, tablas, eliminatorias y predicciones.`
4. `Seguí la actividad del día` — `En el Home vas a ver los partidos de hoy o la próxima fecha disponible.`
5. `Todo listo` — `Ya podés recorrer la app y volver a abrir esta ayuda cuando quieras.`

Navbar tutorial button:

- Visible text: `Ver tutorial`
- Accessible label: `Ver tutorial de la app`


## Part 1 manual fix — tutorial layering and clickability

Manual validation found that the first tutorial version could be visually trapped under Home content and make tutorial buttons unreliable. The corrected version renders the tutorial through a React portal into `document.body`, uses a fixed full-viewport root layer with `z-index: 10000`, keeps the decorative spotlight as its own non-interactive layer, and keeps the dialog panel above the overlay with `pointer-events: auto`.

The tutorial does not elevate real Home elements, hero content, cards or Navbar targets above the overlay. The spotlight remains approximate by design to prioritize stability and clickability over pixel-perfect target masking.

Manual validation status after this fix: validated by the user.


## Part 1 second manual fix — stable spotlight and overlay coordination

A second manual validation found that the tutorial no longer rendered below Home, but the approximate spotlight could point to unclear areas and the tutorial could compete with slow-server feedback overlays. The corrected behavior now waits for a stable Home screen before auto-opening and refuses to open manually while global loading, delayed loading or a feedback modal is active. If blocked, the tutorial is not marked as seen.

Tour targets use stable attributes:

- `data-tour="navbar-menu"`
- `data-tour="home-hero"`
- `data-tour="home-sections"`
- `data-tour="home-daily-schedule"`

The spotlight is calculated from the real target with `document.querySelector`, `scrollIntoView`, `getBoundingClientRect`, and recalculation on step change, scroll and resize. The panel uses simple collision avoidance: below target, above target, side placement, then centered/bottom fallback. If a target is missing or has no size, the tutorial falls back to a centered panel without a spotlight instead of drawing a misleading highlight.

Manual validation status after this second fix: validated by the user.

## Part 1 third manual fix — stable `home-sections` step

A third manual validation found that step 3 (`Explorá por secciones`) could make Home feel unstable because its panel was dynamically positioned around the `data-tour="home-sections"` chip group. That step now has special handling: the chips can still be highlighted when they are safely visible, but the panel uses a fixed, horizontally centered safe position instead of attaching above/below the target. On mobile it stays centered near the bottom.

For `home-sections`, scroll is conservative: the tutorial checks whether the target is already inside the viewport before scrolling, uses `block: "nearest"` only when needed, and never uses smooth scrolling. If the fixed panel would visually compete with the spotlight/target, the spotlight is hidden instead of moving the page aggressively. When the step had to scroll, leaving the step restores a safe scroll position from the tutorial start.

Manual validation status after this third fix: validated by the user.

## Accessibility checklist

Part 1 checklist:

- [x] Navbar menu button preserves `aria-label`, `aria-expanded` and `aria-controls`.
- [x] Tutorial button has an accessible label.
- [x] Decorative Navbar SVGs use `alt=""` and `aria-hidden="true"`.
- [x] Tutorial uses `role="dialog"` and `aria-modal="true"`.
- [x] Tutorial closes with Escape.
- [x] Tutorial controls are keyboard reachable.
- [x] Focus visible styles are preserved for Navbar and tutorial controls.

## Testing checklist

Part 1 tests:

- [x] Home tutorial appears on first visit.
- [x] Home tutorial persists seen state when finished.
- [x] Home tutorial closes and persists with Escape.
- [x] Navbar menu button toggles `aria-expanded`.
- [x] Navbar help button opens tutorial state manually.
- [x] Onboarding storage service handles normal and failing localStorage.
- [x] UI slice stores tutorial state without callbacks.

## Manual QA checklist for Part 1

- [ ] Open `/` in a fresh browser profile and confirm the tutorial appears.
- [ ] Navigate through all tutorial steps with keyboard and mouse.
- [ ] Press Escape and confirm the tutorial closes.
- [ ] Reload Home and confirm the tutorial does not auto-open again.
- [ ] Use `Ver tutorial` from the Navbar and confirm it opens manually.
- [ ] Open/close Navbar menu and confirm the ball button still works.
- [ ] Check mobile width and confirm the tutorial panel remains usable.
- [x] Confirm Part 2 visual changes are limited to Home, `/grupos` and `/posiciones`.
- [x] Confirm Part 3 visual changes are limited to `/eliminatorias`, `/predicciones` and their related components.
