<script lang="ts">
	import { Boot, Crt, Meter, ScreenFrame, Typed } from '$lib/index.js';

	let typedRun = $state(0);
	let bootRun = $state(0);
	let bootDone = $state(false);

	let layers = $state({ scanlines: true, sweep: true, flicker: true, vignette: true });

	const BOOT_LINES = [
		'CRT/UI — BIOS 00.01',
		'TOKENS ................. LOADED',
		'PHOSPHOR ARRAY ......... CALIBRATED',
		'REDUCED MOTION ......... RESPECTED',
		'',
		'READY'
	];

	const TOKENS = [
		['--crt-bg', '#000000', 'page / tube background'],
		['--crt-phos', '#4ade80', 'base phosphor colour'],
		['--crt-phos-hot', '#d5ffe6', 'emphasis (titles, values)'],
		['--crt-phos-mid', 'rgba(…, .62)', 'secondary text'],
		['--crt-phos-dim', 'rgba(…, .4)', 'labels, footers'],
		['--crt-phos-faint', 'rgba(…, .16)', 'unlit meter cells'],
		['--crt-bar', '#1ee07c', 'lit meter / progress cells'],
		['--crt-rule', 'rgba(…, .26)', 'hairlines and borders'],
		['--crt-display', 'var(--crt-mono)', 'display face for titles'],
		['--crt-sweep-duration', '7.5s', 'beam pass period'],
		['--crt-scanline-gap', '3px', 'scanline pitch'],
		['--crt-cell-width', '6px', 'meter cell width']
	];
</script>

<svelte:head>
	<title>crt-ui — CRT terminal components for Svelte 5</title>
	<meta
		name="description"
		content="SSR-safe, token-driven CRT terminal components for Svelte 5: Typed, Crt, Meter, Boot, ScreenFrame."
	/>
</svelte:head>

<main class="shell">
	<header class="head">
		<h1 class="head__name"><Typed text="@ritsuki.kagerou/crt-ui" speed={40} hold /></h1>
		<p class="head__tag dim">
			CRT terminal components for Svelte 5 — SSR-safe, token-driven, reduced-motion aware.
		</p>
		<hr class="rule" />
		<pre>pnpm add @ritsuki.kagerou/crt-ui</pre>
		<pre>{`<script>
  import '@ritsuki.kagerou/crt-ui/tokens.css';
  import { Typed, Crt } from '@ritsuki.kagerou/crt-ui';
<\/script>`}</pre>
	</header>

	<section class="demo">
		<div class="demo__bar">
			<h2 class="label">Typed</h2>
			<button class="ctl" onclick={() => (typedRun += 1)}>REPLAY</button>
		</div>
		<hr class="rule" />
		<div class="demo__stage">
			{#key typedRun}
				<p class="hot"><Typed text="DECRYPTING PERSONAL LOG ... OK" speed={26} hold /></p>
				<p><Typed text="the caret holds when the line is done" speed={18} delay={900} /></p>
			{/key}
		</div>
		<p class="note dim">
			Server-renders the finished line, so hydration never mismatches. Typing starts after
			hydration; under <code>prefers-reduced-motion</code> the line appears at once.
		</p>
	</section>

	<section class="demo">
		<h2 class="label">Meter</h2>
		<hr class="rule" />
		<div class="demo__stage demo__stage--rows">
			<Meter value={1} label="PRIMARY" />
			<Meter value={0.6} label="WORKING" muted delay={120} />
			<Meter value={0.3} label="LEARNING" muted delay={240} />
			<Meter value={0.45} label="32 CELLS" cells={32} delay={360} stagger={14} />
		</div>
		<p class="note dim">
			Takes a 0–1 fraction, not a category — the consumer decides what a tier means. Exposed
			to assistive tech as <code>role="meter"</code>.
		</p>
	</section>

	<section class="demo">
		<div class="demo__bar">
			<h2 class="label">Boot</h2>
			<button
				class="ctl"
				onclick={() => {
					bootDone = false;
					bootRun += 1;
				}}>REPLAY</button
			>
		</div>
		<hr class="rule" />
		<div class="demo__stage">
			{#key bootRun}
				{#if bootDone}
					<p class="hot">ondone fired — the app takes over here.</p>
				{:else}
					<Boot
						lines={BOOT_LINES}
						unit="CRT/UI 0.1.0"
						skippable={false}
						ondone={() => (bootDone = true)}
					/>
				{/if}
			{/key}
		</div>
		<p class="note dim">
			Lines chain through <code>Typed</code>'s <code>oncomplete</code>; the stepped bar closes
			the sequence. <code>skippable</code> is off here so the demo cannot be ended by a stray
			key press.
		</p>
	</section>

	<section class="demo">
		<h2 class="label">ScreenFrame</h2>
		<hr class="rule" />
		<div class="demo__stage demo__stage--frame">
			<ScreenFrame
				title="CAPABILITY MATRIX"
				code="SECTOR 02/05"
				footer="CRT/UI DOCS"
				onback={() => {}}
			>
				<ul class="frame-list">
					<li><span class="dim">C-01</span> <span class="hot">BACKEND &amp; API</span></li>
					<li><span class="dim">C-02</span> <span class="hot">INFRASTRUCTURE</span></li>
					<li><span class="dim">C-03</span> <span class="hot">DATABASE</span></li>
				</ul>
			</ScreenFrame>
		</div>
		<p class="note dim">
			Content is a snippet; title, code, footer and the back label are plain text props. Drop
			<code>onback</code> to render the frame without a back control.
		</p>
	</section>

	<section class="demo">
		<h2 class="label">Crt</h2>
		<hr class="rule" />
		<div class="demo__toggles">
			{#each Object.keys(layers) as key (key)}
				<label class="toggle">
					<input type="checkbox" bind:checked={layers[key as keyof typeof layers]} />
					{key}
				</label>
			{/each}
		</div>
		<div class="demo__tube">
			<p class="hot">SIGNAL LOCKED</p>
			<p class="dim">this box has its own tube, scoped with position="absolute"</p>
			<Crt
				position="absolute"
				scanlines={layers.scanlines}
				sweep={layers.sweep}
				flicker={layers.flicker}
				vignette={layers.vignette}
			/>
		</div>
		<p class="note dim">
			Pointer-transparent and <code>aria-hidden</code>. Mounted once in the root layout it
			covers the viewport; with <code>position="absolute"</code> it covers the nearest
			positioned ancestor instead.
		</p>
	</section>

	<section class="demo">
		<h2 class="label">Tokens</h2>
		<hr class="rule" />
		<ul class="tokens">
			{#each TOKENS as [name, value, note] (name)}
				<li>
					<code class="hot">{name}</code>
					<span class="dim">{value}</span>
					<span class="dim">{note}</span>
				</li>
			{/each}
		</ul>
		<p class="note dim">
			Every component also carries these values inline as fallbacks, so the package renders
			correctly even if <code>tokens.css</code> is never imported.
		</p>
	</section>

	<footer class="foot dim">
		MIT · <a href="https://github.com/ritsuki-kagerou/crt-ui">github.com/ritsuki-kagerou/crt-ui</a>
	</footer>
</main>

<style>
	.head {
		display: grid;
		gap: 0.8rem;
	}

	.head__name {
		font-family: var(--crt-display);
		font-weight: 800;
		font-size: clamp(1.3rem, 4vw, 2rem);
		letter-spacing: 0.1em;
		color: var(--crt-phos-hot);
	}

	.head__tag {
		max-width: 60ch;
	}

	.demo {
		display: grid;
		gap: 0.9rem;
	}

	.demo__bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.demo__stage {
		display: grid;
		gap: 0.4rem;
		padding: 1.2rem;
		border: 1px solid var(--crt-rule);
		min-height: 6rem;
		align-content: start;
	}

	.demo__stage--rows {
		gap: 0.6rem;
	}

	.demo__stage--frame {
		--crt-screen-min-height: 0;
	}

	.frame-list {
		display: grid;
		gap: 0.3rem;
		letter-spacing: 0.1em;
	}

	.demo__toggles {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.9em;
		letter-spacing: 0.12em;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
		text-transform: uppercase;
	}

	.toggle input {
		accent-color: var(--crt-bar);
	}

	.demo__tube {
		position: relative;
		overflow: hidden;
		display: grid;
		gap: 0.3rem;
		place-content: center;
		text-align: center;
		min-height: 11rem;
		border: 1px solid var(--crt-rule);
		background: #010401;
	}

	.tokens {
		display: grid;
		gap: 0.3rem;
		font-size: 0.92em;
	}

	.tokens li {
		display: grid;
		grid-template-columns: minmax(0, 15rem) minmax(0, 10rem) minmax(0, 1fr);
		gap: 1rem;
	}

	.note {
		font-size: 0.92em;
		max-width: 72ch;
	}

	.foot {
		font-size: 0.9em;
		letter-spacing: 0.12em;
	}

	@media (max-width: 720px) {
		.tokens li {
			grid-template-columns: 1fr;
			gap: 0;
		}
	}
</style>
