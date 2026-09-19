# crt-ui

CRT terminal components for Svelte 5 — SSR-safe, token-driven, reduced-motion aware.

Every retro-terminal UI ends up rewriting the same five pieces: a typewriter effect that
breaks hydration, a scanline overlay that eats pointer events, a segmented meter, a boot
sequence, and the chrome around a screen. This package is those five pieces, extracted from
a real site and given an API.

<!-- TODO: docs/demo.gif — the docs site, one pass through Boot → menu → ScreenFrame -->

## Install

```sh
pnpm add @ritsuki.kagerou/crt-ui
```

Svelte 5 is a peer dependency. No runtime dependencies.

## Use

```svelte
<script lang="ts">
	import '@ritsuki.kagerou/crt-ui/tokens.css';
	import { Boot, Crt, Meter, ScreenFrame, Typed } from '@ritsuki.kagerou/crt-ui';

	let booted = $state(false);
</script>

{#if !booted}
	<Boot lines={['RK/OS — BIOS 04.71', 'MEMORY CHECK ... OK']} unit="RK/OS 9000" ondone={() => (booted = true)} />
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
| `Typed`       | Types one line out, with a caret that can hold and blink after the line.  |
| `Crt`         | The tube: scanlines, beam sweep, phosphor flicker, vignette.              |
| `Meter`       | Segmented bar readout driven by a 0–1 fraction.                           |
| `Boot`        | A POST-style boot log that chains lines, then a stepped progress bar.     |
| `ScreenFrame` | Chrome around one screen: typed title, sector code, rules, back control.  |

### `Typed`

| Prop         | Type         | Default | Notes                                    |
| ------------ | ------------ | ------- | ---------------------------------------- |
| `text`       | `string`     | —       | required                                 |
| `speed`      | `number`     | `12`    | ms per character                         |
| `delay`      | `number`     | `0`     | ms before the first character            |
| `hold`       | `boolean`    | `false` | keep a blinking caret after the line     |
| `oncomplete` | `() => void` | —       | fires once the last character is drawn   |
| `ontick`     | `(drawn: number) => void` | — | fires per frame as characters appear |

### `Crt`

| Prop                                     | Type                      | Default   |
| ---------------------------------------- | ------------------------- | --------- |
| `scanlines` / `sweep` / `flicker` / `vignette` | `boolean`           | `true`    |
| `position`                               | `'fixed' \| 'absolute'`   | `'fixed'` |

### `Meter`

| Prop      | Type      | Default | Notes                             |
| --------- | --------- | ------- | --------------------------------- |
| `value`   | `number`  | —       | 0–1, clamped                      |
| `label`   | `string`  | `''`    | printed after the bar             |
| `muted`   | `boolean` | `false` | label in the secondary colour     |
| `cells`   | `number`  | `24`    | segments in the bar               |
| `delay`   | `number`  | `0`     | ms before the first cell lights   |
| `stagger` | `number`  | `26`    | ms between cells                  |

### `Boot`

| Prop        | Type         | Default                       | Notes                            |
| ----------- | ------------ | ----------------------------- | -------------------------------- |
| `lines`     | `string[]`   | —                             | empty strings are legal spacers  |
| `unit`      | `string`     | `''`                          | header above the log             |
| `hint`      | `string`     | `'PRESS ANY KEY TO CONTINUE'` |                                  |
| `speed`     | `number`     | `9`                           | ms per character                 |
| `duration`  | `number`     | `1100`                        | ms for the progress bar          |
| `skippable` | `boolean`    | `true`                        | key / pointer ends it early      |
| `ondone`    | `() => void` | —                             | required                         |
| `ontick`    | `(drawn: number) => void` | —               | forwarded to each line's `Typed`  |

### `ScreenFrame`

| Prop         | Type         | Default        | Notes                              |
| ------------ | ------------ | -------------- | ---------------------------------- |
| `title`      | `string`     | —              | typed on mount                     |
| `code`       | `string`     | `''`           | right-aligned in the title bar     |
| `hint`       | `string`     | `'[ESC] BACK'` | label on the back control          |
| `footer`     | `string`     | `''`           | right-aligned footer text          |
| `onback`     | `() => void` | —              | omit to render without the control |
| `titleSpeed` | `number`     | `26`           | ms per character                   |
| `ontick`     | `(drawn: number) => void` | —  | forwarded to the title's `Typed`   |

## Theming

Import `@ritsuki/crt-ui/tokens.css` once, then override any `--crt-*` custom property —
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

Every component carries the same defaults inline, so skipping `tokens.css` and declaring
the tokens yourself works too. Full list: [`src/lib/tokens.css`](src/lib/tokens.css).

## Docs site

```sh
pnpm install
pnpm dev      # docs site with live demos of every component
pnpm package  # build the publishable package into dist/ and lint it with publint
pnpm build    # prerender the docs site into build/
```

## Why it is built this way

**Hydration, not hacks.** `Typed` server-renders the finished line and hydrates into exactly
that, then starts typing from an effect. Most typewriter components render a partial string
on the server and mismatch on hydration; this one cannot, because the typed state does not
exist until the client is running.

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
