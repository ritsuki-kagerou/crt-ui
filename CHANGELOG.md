# Changelog

All notable changes to `@ritsuki.kagerou/crt-ui` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/ritsuki-kagerou/crt-ui/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/ritsuki-kagerou/crt-ui/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/ritsuki-kagerou/crt-ui/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ritsuki-kagerou/crt-ui/releases/tag/v1.0.0
