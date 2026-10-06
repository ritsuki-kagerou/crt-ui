# Changelog

All notable changes to `@ritsuki.kagerou/crt-ui` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `Crt`: `noise` (film grain) and `curvature` (rounded glass corners and bezel shading) props,
  both off by default, with tokens `--crt-noise-opacity`, `--crt-noise-duration`,
  `--crt-curvature-radius` and `--crt-curvature-shade`. Noise stops under
  `prefers-reduced-motion`.
- The `Crt` root now clips its overflow.
- `data-crt-motion="off"` on any ancestor turns animation off by hand, with the same effect as
  `prefers-reduced-motion: reduce` (`Crt`, `Typed`, `Boot`, `Meter`, `Button`, `Input`/`Select`,
  `Toaster`). It never overrides the OS setting the other way.

## [1.5.0] — 2026-10-06

### Added

- `Table`: a native `<table>` with a `<caption>`, `scope` on every header, an optional row
  header column (`rowHeader`), per-column `align`, an `empty` message and a `cell` snippet for
  custom content. A named table scrolls inside a focusable region. `TableColumn` is exported
  as a type.
- Spacing tokens `--crt-space-1` … `--crt-space-5`, and type tokens `--crt-text-sm`, `-md`,
  `-lg` and `--crt-leading`.
- `@ritsuki.kagerou/crt-ui/presets/white.css`: a white phosphor (P4) preset, set on the same
  three palette tokens. The docs page gains a P4 WHITE theme.
- Tests: SSR/hydration cases, jsdom behaviour tests and axe for `Table`, and the Table on the
  e2e page.

### Fixed

- `Toaster`: the close button was dimmed with `opacity`, which dropped an error toast's `[X]`
  below WCAG AA contrast (4.45:1). It now keeps full colour and underlines on hover.

## [1.4.0] — 2026-10-05

### Added

- `Dialog`: a modal window on the native `<dialog>`. Focus trap, inert background, Escape and
  focus return come from the platform. `open` is bindable; `title` labels it; `footer` is a
  snippet; `dismissable` (default) controls Escape, backdrop click and the close button;
  `onclose` runs however it closed. Server-rendered closed.
- `Tabs`: the WAI-ARIA tabs pattern. Left/Right, Home and End move between and select tabs,
  disabled tabs are skipped, only the selected tab is in the Tab order, and the panel is a
  focusable region labelled by its tab. `children` receives the active tab's id. `TabItem` is
  exported as a type.
- `Dropdown`: the WAI-ARIA menu-button pattern, with arrow keys, Home/End, typeahead, Escape
  returning focus to the button, and Tab or an outside click closing the menu. Items are
  actions (`onselect`) or links (`href`); disabled items are skipped. `DropdownItem` is
  exported as a type.
- `Toaster` and `toast`: `toast.push(message, { kind, duration })` feeds one `<Toaster />`
  that keeps a polite and an assertive live region in the page. Timers pause on hover and
  focus; errors stay until dismissed. `ToastKind`, `ToastMessage` and `ToastOptions` are
  exported as types.
- `--crt-dialog-width` token.
- Tests: SSR/hydration cases for the new components, jsdom behaviour tests (keyboard,
  focus, timers), axe on the open states, and Chromium e2e for focus trapping, focus return,
  backdrop click, keyboard navigation and contrast.

## [1.3.0] — 2026-10-04

### Added

- `Button`: a native `<button>`, or an `<a>` with `href`. `variant` is `outline` (default) or
  `solid`; `type` defaults to `button`. A disabled link drops its `href` and ignores clicks.
- `Input`: a labelled text field behind a decorative prompt, with `bind:value`, `hint` and
  `error`. Both texts are linked with `aria-describedby`; `error` also sets `aria-invalid`.
- `Select`: a labelled native `<select>` in the same frame, taking strings or
  `{ value, label, disabled }` objects, with an optional `placeholder`. `SelectOption` is
  exported as a type. In Chrome/Edge 135+ the open list is themed as well, through
  `appearance: base-select`; other browsers keep their native popup.
- `Input` and `Select` generate their `id` with `$props.id()`, so it survives SSR and hydration.
  Any other native attribute is passed through on all three components.
- `--crt-alert` token (default `#ff6b5e`) for error text and borders.
- Automated accessibility tests: axe (WCAG 2.1 A/AA) on every component in jsdom, and on the
  whole test app in Chromium with colour contrast included.

### Fixed

- Text that failed WCAG AA contrast on the default black background is brighter: the
  `ScreenFrame` code and footer text now use `--crt-phos-mid` instead of `--crt-phos-dim`, and
  `Boot`'s "press any key" hint uses `--crt-phos-hot` and pulses between 55% and 100% opacity
  instead of 35% and 90%.

## [1.2.1] — 2026-10-04

### Documentation

- README notes that the components use Svelte 5 APIs only (callback props, snippets) and lists
  every `--crt-*` token with its default and the components that read it.
- The docs site serves `/llms.txt`, a compact API and token summary for AI tools.

## [1.2.0] — 2026-10-02

### Added

- `--crt-tube-glow` token (default `6%`) sets how strongly the phosphor glows behind the screen
  in `Crt`'s vignette layer. The docs demo has a slider for it.

## [1.1.0] — 2026-09-29

### Added

- `ScreenFrame` takes an optional `backHref`. With it, the back control renders as an
  `<a class="screen__back" href>` that crawlers and no-JS readers can follow. If `onback` is set
  too, a plain click runs `onback` instead of navigating; modified clicks (new tab, new window)
  are left to the browser. With only `onback`, the control is still a `<button>`.
- The back control has a visible `:focus-visible` outline.

### Changed

- `Typed` puts its text in the markup once until typing starts. Server-rendered HTML (and the
  first client render) is now plain text inside the wrapper `<span>`, with no `.crt-sr` copy and
  no `aria-hidden` copy. The screen-reader/visual pair is only rendered while the line animates.
  Tools that strip tags no longer read every line twice ("IDENTITY IDENTITY").

  This changes no props, but CSS or tests that target `.crt-sr` or `[aria-hidden]` inside
  `Typed` before the animation starts will no longer match. This affects `Boot` and
  `ScreenFrame` titles as well, since both render through `Typed`.

## [1.0.1] — 2026-09-27

### Fixed

- `Crt`'s sweep and glow follow the phosphor tokens, so re-skinning `--crt-phos` (e.g. to amber)
  re-colours them too.

## [1.0.0] — 2026-09-26

First release: `Crt`, `Typed`, `Boot`, `Meter` and `ScreenFrame`, themed through the `--crt-*`
tokens in `tokens.css`, with deterministic SSR output and hydration covered by tests.

[Unreleased]: https://github.com/ritsuki-kagerou/crt-ui/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/ritsuki-kagerou/crt-ui/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/ritsuki-kagerou/crt-ui/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/ritsuki-kagerou/crt-ui/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/ritsuki-kagerou/crt-ui/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/ritsuki-kagerou/crt-ui/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ritsuki-kagerou/crt-ui/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/ritsuki-kagerou/crt-ui/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ritsuki-kagerou/crt-ui/releases/tag/v1.0.0
