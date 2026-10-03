# crt-ui

CRT terminal components for Svelte 5 — SSR-safe, token-driven, reduced-motion aware.

Every retro-terminal UI ends up rewriting the same five pieces: a typewriter effect that
breaks hydration, a scanline overlay that eats pointer events, a segmented meter, a boot
sequence, and the chrome around a screen. This package is those five pieces, extracted from
a real site and given an API.

## Install

```sh
pnpm add @ritsuki.kagerou/crt-ui
```

Svelte 5 is a peer dependency. No runtime dependencies.

The components are written in runes mode and use Svelte 5 APIs only: events are callback props
(`ondone`, `onback`, `oncomplete`), not `on:` directives, and `ScreenFrame`'s content is a
`children` snippet, not a slot. Svelte 4 syntax will not work.

## Use

```svelte
<script lang="ts">
	import '@ritsuki.kagerou/crt-ui/tokens.css';
	import { Boot, Crt, Meter, ScreenFrame, Typed } from '@ritsuki.kagerou/crt-ui';

	let booted = $state(false);
</script>

{#if !booted}
	<Boot
		lines={['RK/OS — BIOS 04.71', 'MEMORY CHECK ... OK']}
		unit="RK/OS 9000"
		ondone={() => (booted = true)}
	/>
{:else}
	<ScreenFrame title="CAPABILITY MATRIX" code="SECTOR 02/05" onback={() => (booted = false)}>
		<p><Typed text="BACKEND & API" speed={18} /></p>
		<Meter value={1} label="PRIMARY" />
	</ScreenFrame>
{/if}

<Crt />
```

## Components

| Component     | What it does                                                             |
| ------------- | ------------------------------------------------------------------------ |
| `Typed`       | Types one line out, with a caret that can hold and blink after the line. |
| `Crt`         | The tube: scanlines, beam sweep, phosphor flicker, vignette.             |
| `Meter`       | Segmented bar readout driven by a 0–1 fraction.                          |
| `Boot`        | A POST-style boot log that chains lines, then a stepped progress bar.    |
| `ScreenFrame` | Chrome around one screen: typed title, sector code, rules, back control. |

Every component also takes `class`, applied to its root element.

### `Typed`

| Prop         | Type                      | Default | Notes                                  |
| ------------ | ------------------------- | ------- | -------------------------------------- |
| `text`       | `string`                  | —       | required                               |
| `speed`      | `number`                  | `12`    | ms per character                       |
| `delay`      | `number`                  | `0`     | ms before the first character          |
| `hold`       | `boolean`                 | `false` | keep a blinking caret after the line   |
| `oncomplete` | `() => void`              | —       | fires once the last character is drawn |
| `ontick`     | `(drawn: number) => void` | —       | fires per frame as characters appear   |

### `Crt`

| Prop                                           | Type                    | Default   |
| ---------------------------------------------- | ----------------------- | --------- |
| `scanlines` / `sweep` / `flicker` / `vignette` | `boolean`               | `true`    |
| `position`                                     | `'fixed' \| 'absolute'` | `'fixed'` |

How bright the phosphor glows behind the screen is a token, not a prop: set `--crt-tube-glow`
(default `6%`, `0%` turns it off). The glow is drawn by the vignette layer, so it goes away with
`vignette={false}`.

### `Meter`

| Prop      | Type      | Default | Notes                           |
| --------- | --------- | ------- | ------------------------------- |
| `value`   | `number`  | —       | 0–1, clamped                    |
| `label`   | `string`  | `''`    | printed after the bar           |
| `muted`   | `boolean` | `false` | label in the secondary colour   |
| `cells`   | `number`  | `24`    | segments in the bar             |
| `delay`   | `number`  | `0`     | ms before the first cell lights |
| `stagger` | `number`  | `26`    | ms between cells                |

### `Boot`

| Prop        | Type                      | Default                       | Notes                               |
| ----------- | ------------------------- | ----------------------------- | ----------------------------------- |
| `lines`     | `string[]`                | —                             | empty strings are legal spacers     |
| `unit`      | `string`                  | `''`                          | header above the log                |
| `hint`      | `string`                  | `'PRESS ANY KEY TO CONTINUE'` | shown once the progress bar appears |
| `speed`     | `number`                  | `9`                           | ms per character                    |
| `duration`  | `number`                  | `1100`                        | ms for the progress bar             |
| `skippable` | `boolean`                 | `true`                        | key / pointer ends it early         |
| `ondone`    | `() => void`              | —                             | required                            |
| `ontick`    | `(drawn: number) => void` | —                             | forwarded to each line's `Typed`    |

### `ScreenFrame`

| Prop         | Type                      | Default        | Notes                              |
| ------------ | ------------------------- | -------------- | ---------------------------------- |
| `children`   | `Snippet`                 | —              | required; the screen's content     |
| `title`      | `string`                  | —              | typed on mount                     |
| `code`       | `string`                  | `''`           | right-aligned in the title bar     |
| `hint`       | `string`                  | `'[ESC] BACK'` | label on the back control          |
| `footer`     | `string`                  | `''`           | right-aligned footer text          |
| `onback`     | `() => void`              | —              | runs when the control is activated |
| `backHref`   | `string`                  | —              | renders the control as a link      |
| `titleSpeed` | `number`                  | `26`           | ms per character                   |
| `ontick`     | `(drawn: number) => void` | —              | forwarded to the title's `Typed`   |

`hint` is only a label: `onback` fires when the control is clicked, and `ScreenFrame` does not
listen for the Escape key itself. Bind it where your app handles keyboard navigation:

```svelte
<svelte:window onkeydown={(e) => e.key === 'Escape' && goBack()} />
```

With only `onback`, the control is a `<button>`. Give it `backHref` as well and it becomes an
`<a href>` that crawlers and no-JS readers can follow; a plain click still runs `onback` instead of
navigating, while modified clicks (new tab, new window) are left to the browser. Omit both to
render the frame without a back control.

```svelte
<ScreenFrame title="IDENTITY" backHref="?screen=menu" onback={() => (screen = 'menu')}>
```

## Theming

Import `@ritsuki.kagerou/crt-ui/tokens.css` once, then override any `--crt-*` custom property —
on `:root`, or on any ancestor, since every component reads them through the cascade:

```css
:root {
	--crt-phos: #ffb000; /* amber tube */
	--crt-phos-hot: #fff0c9;
	--crt-bar: #ffc23d;
	--crt-display: 'Martian Mono', monospace;
	--crt-sweep-duration: 12s;
}
```

The dimmer shades (`--crt-phos-mid`, `-dim`, `-faint`, `--crt-rule`, `--crt-glow`,
`--crt-flicker-ink`) and the tube's sweep and glow are derived from `--crt-phos`,
`--crt-phos-hot` and `--crt-bar` with `color-mix()`, so the three lines above re-skin
everything. The derived tokens are computed where `tokens.css` declares them, on `:root`: when
you re-skin a single subtree instead, set the shades you need on that ancestor as well.

Every component carries the same defaults inline, so skipping `tokens.css` and declaring
the tokens yourself works too.

| Token                     | Default                           | Used by                        |
| ------------------------- | --------------------------------- | ------------------------------ |
| `--crt-bg`                | `#000000`                         | —                              |
| `--crt-phos`              | `#4ade80`                         | `Crt`, derived shades          |
| `--crt-phos-hot`          | `#d5ffe6`                         | all but `Typed`                |
| `--crt-bar`               | `#1ee07c`                         | `Meter`, `Boot`                |
| `--crt-phos-mid`          | 62% of `--crt-phos`               | `Meter`, `Boot`                |
| `--crt-phos-dim`          | 40% of `--crt-phos`               | `Boot`, `ScreenFrame`          |
| `--crt-phos-faint`        | 16% of `--crt-phos`               | `Meter`, `Boot`                |
| `--crt-rule`              | 26% of `--crt-phos`               | `ScreenFrame`                  |
| `--crt-glow`              | 50% of `--crt-bar`                | `Meter`, `Boot`                |
| `--crt-mono`              | `ui-monospace, …, monospace`      | —                              |
| `--crt-display`           | `var(--crt-mono)`                 | `Meter`, `Boot`, `ScreenFrame` |
| `--crt-tracking`          | `0.12em`                          | —                              |
| `--crt-z`                 | `90`                              | `Crt`                          |
| `--crt-scanline-gap`      | `3px`                             | `Crt`                          |
| `--crt-scanline-ink`      | `rgba(0, 0, 0, 0.26)`             | `Crt`                          |
| `--crt-scanline-opacity`  | `0.6`                             | `Crt`                          |
| `--crt-sweep-height`      | `42vh`                            | `Crt`                          |
| `--crt-sweep-duration`    | `7.5s`                            | `Crt`                          |
| `--crt-flicker-duration`  | `4.2s`                            | `Crt`                          |
| `--crt-flicker-ink`       | 2.5% of `--crt-phos`              | `Crt`                          |
| `--crt-vignette-strength` | `0.55`                            | `Crt`                          |
| `--crt-tube-glow`         | `6%`                              | `Crt`                          |
| `--crt-caret-width`       | `0.58em`                          | `Typed`                        |
| `--crt-caret-height`      | `1.02em`                          | `Typed`                        |
| `--crt-caret-blink`       | `1.06s`                           | `Typed`                        |
| `--crt-cell-width`        | `6px`                             | `Meter`                        |
| `--crt-cell-height`       | `12px`                            | `Meter`                        |
| `--crt-cell-gap`          | `2px`                             | `Meter`                        |
| `--crt-screen-min-height` | `46vh` (not declared in the file) | `ScreenFrame`                  |

`--crt-bg`, `--crt-mono` and `--crt-tracking` are declared for your app to use; no component
reads them directly. Source: [`src/lib/tokens.css`](src/lib/tokens.css).

`color-mix()` needs Chrome/Edge 111, Safari 16.2 or Firefox 113 and later.

## Development

```sh
pnpm install
pnpm dev       # docs site with live demos of every component
pnpm package   # build the publishable package into dist/ and lint it with publint
pnpm build     # prerender the docs site into build/
pnpm lint      # Prettier, check only
pnpm check     # svelte-check
pnpm test      # SSR + hydration unit tests (Vitest)
pnpm test:e2e  # package, then hydrate a real SvelteKit app in Chromium (Playwright)
```

`pnpm test:e2e` needs Chromium once: `pnpm --filter crt-ui-ssr-app exec playwright install chromium`.

## Why it is built this way

**Hydration, not hacks.** `Typed` server-renders the finished line and hydrates into exactly
that, then starts typing from an effect. Most typewriter components render a partial string
on the server and mismatch on hydration; this one cannot, because the typed state does not
exist until the client is running.

That claim is tested, not just stated. CI renders every component on the server and mounts
its browser build, and fails if the two first-pass markups differ. It then hydrates a real
SvelteKit app, under both `vite dev` and a production build, and fails on any hydration
warning or console error.

**Tokens, not props, for looks.** Colour, timing and geometry are CSS custom properties.
Props stay behavioural. That keeps the API small and lets a consumer reskin the whole set —
green tube to amber tube — without touching a single component.

**Motion is optional.** Every animation is behind `prefers-reduced-motion: reduce`: the
sweep is removed, flicker and caret blink stop, meter cells light instantly, and `Typed`
resolves the full line in one frame while still firing `oncomplete` so boot sequences do not
stall.

**Extracted, not invented.** These components ran on a personal site first. The work here
was tightening the API and cutting the app-specific data out of them — not inventing a
library in the abstract.

## License

MIT
