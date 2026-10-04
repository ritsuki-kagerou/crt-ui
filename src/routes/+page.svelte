<script lang="ts">
	import {
		Boot,
		Button,
		Crt,
		Dialog,
		Dropdown,
		Input,
		Meter,
		ScreenFrame,
		Select,
		Tabs,
		Toaster,
		toast,
		Typed
	} from '$lib/index.js';

	let typedRun = $state(0);
	let bootRun = $state(0);
	let bootDone = $state(false);

	let layers = $state({ scanlines: true, sweep: true, flicker: true, vignette: true });
	let glow = $state(6);

	const THEMES = [
		{ id: 'green', label: 'P1 GREEN', tokens: {} },
		{
			id: 'amber',
			label: 'P3 AMBER',
			tokens: { '--crt-phos': '#ffb000', '--crt-phos-hot': '#fff0c9', '--crt-bar': '#ffc23d' }
		}
	] as const;
	const THEME_TOKENS = ['--crt-phos', '--crt-phos-hot', '--crt-bar'];

	let themeId = $state<(typeof THEMES)[number]['id']>('green');
	let theme = $derived(THEMES.find((t) => t.id === themeId)!);
	let themeCss = $derived(
		Object.keys(theme.tokens).length
			? `:root {\n${Object.entries(theme.tokens)
					.map(([k, v]) => `  ${k}: ${v};`)
					.join('\n')}\n}`
			: '/* the defaults in tokens.css */'
	);

	// tokens are re-skinned on :root, where tokens.css derives the shades
	$effect(() => {
		const root = document.documentElement.style;
		for (const name of THEME_TOKENS) root.removeProperty(name);
		for (const [name, value] of Object.entries(theme.tokens)) root.setProperty(name, value);
	});

	let email = $state('');
	let emailError = $derived(
		email && !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email address' : undefined
	);
	let role = $state('');
	let menuChoice = $state('');
	let tab = $state('account');
	let deleteOpen = $state(false);

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
		['--crt-phos-mid', 'rgba(…, .62)', 'secondary text, labels, footers'],
		['--crt-phos-dim', 'rgba(…, .4)', 'decorative text in your app'],
		['--crt-phos-faint', 'rgba(…, .16)', 'unlit meter cells'],
		['--crt-bar', '#1ee07c', 'lit meter / progress cells'],
		['--crt-rule', 'rgba(…, .26)', 'hairlines and borders'],
		['--crt-alert', '#ff6b5e', 'error text and borders'],
		['--crt-display', 'var(--crt-mono)', 'display face for titles'],
		['--crt-tube-glow', '6%', 'phosphor glow behind the screen'],
		['--crt-sweep-duration', '7.5s', 'beam pass period'],
		['--crt-scanline-gap', '3px', 'scanline pitch'],
		['--crt-cell-width', '6px', 'meter cell width']
	];
</script>

<svelte:head>
	<title>crt-ui — CRT terminal components for Svelte 5</title>
	<meta
		name="description"
		content="SSR-safe, token-driven CRT terminal components for Svelte 5: Typed, Crt, Meter, Boot, ScreenFrame, Button, Input, Select, Dialog, Tabs, Dropdown, Toast."
	/>
	<link rel="canonical" href="https://crt-ui.ritsuki.dev/" />

	<!-- link previews (Discord, Slack, X…) -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="crt-ui" />
	<meta property="og:title" content="crt-ui — CRT terminal components for Svelte 5" />
	<meta
		property="og:description"
		content="SSR-safe, token-driven CRT terminal components for Svelte 5: Typed, Crt, Meter, Boot, ScreenFrame, Button, Input, Select, Dialog, Tabs, Dropdown, Toast."
	/>
	<meta property="og:url" content="https://crt-ui.ritsuki.dev/" />
	<meta property="og:image" content="https://crt-ui.ritsuki.dev/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:image:alt"
		content="The crt-ui docs page: the package name, tagline and install command in green phosphor."
	/>
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<main class="shell">
	<header class="head">
		<h1 class="head__name"><Typed text="@ritsuki.kagerou/crt-ui" speed={40} hold /></h1>
		<p class="head__tag dim">
			CRT terminal components for Svelte 5 — SSR-safe, token-driven, reduced-motion aware.
		</p>
		<div class="themes" role="group" aria-label="Phosphor theme">
			<span class="label">Theme</span>
			{#each THEMES as t (t.id)}
				<Button
					variant={themeId === t.id ? 'solid' : 'outline'}
					aria-pressed={themeId === t.id}
					onclick={() => (themeId = t.id)}>{t.label}</Button
				>
			{/each}
		</div>
		<pre class="themes__css">{themeCss}</pre>
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
			Takes a 0–1 fraction, not a category — the consumer decides what a tier means. Exposed to
			assistive tech as <code>role="meter"</code>.
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
			Lines chain through <code>Typed</code>'s <code>oncomplete</code>; the stepped bar closes the
			sequence. <code>skippable</code> is off here so the demo cannot be ended by a stray key press.
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
			<code>onback</code> to render the frame without a back control, or add
			<code>backHref</code> to make it a real link crawlers can follow.
		</p>
	</section>

	<section class="demo">
		<h2 class="label">Button</h2>
		<hr class="rule" />
		<div class="demo__stage demo__stage--form">
			<div class="form-actions">
				<Button variant="solid">Primary</Button>
				<Button>Outline</Button>
				<Button disabled>Disabled</Button>
				<Button href="https://github.com/ritsuki-kagerou/crt-ui">Link</Button>
			</div>
		</div>
		<p class="note dim">
			A native <code>&lt;button&gt;</code>. <code>solid</code> is for the one primary action; give
			it an
			<code>href</code> and it renders a real link.
		</p>
		<pre>{`<Button variant="solid" onclick={save}>Save changes</Button>
<Button>Cancel</Button>
<Button href="/docs">Read the docs</Button>`}</pre>
	</section>

	<section class="demo">
		<h2 class="label">Input</h2>
		<hr class="rule" />
		<div class="demo__stage demo__stage--form">
			<Input
				label="Email"
				type="email"
				bind:value={email}
				placeholder="you@example.com"
				hint="We will never share your email."
				error={emailError}
			/>
			<Input label="Password" type="password" prompt="" autocomplete="off" />
		</div>
		<p class="note dim">
			A labelled text field. Type something without an <code>@</code> in Email to see the error
			state.
			<code>hint</code> and <code>error</code> are linked with <code>aria-describedby</code>.
		</p>
		<pre>{`<Input label="Email" type="email" bind:value={email} hint="We will never share your email." error={emailError} />`}</pre>
	</section>

	<section class="demo">
		<h2 class="label">Select</h2>
		<hr class="rule" />
		<div class="demo__stage demo__stage--form">
			<Select
				label="Role"
				placeholder="Choose a role"
				options={[
					{ value: 'viewer', label: 'Viewer' },
					{ value: 'editor', label: 'Editor' },
					{ value: 'admin', label: 'Admin', disabled: true }
				]}
				bind:value={role}
			/>
			<p class="hot" aria-live="polite">{role ? `Selected: ${role}` : 'Nothing selected yet.'}</p>
		</div>
		<p class="note dim">
			A native <code>&lt;select&gt;</code>, so keyboard, touch and screen readers work as the
			platform intends. In Chrome and Edge 135+ the open list is themed too.
		</p>
		<pre>{`<Select label="Role" placeholder="Choose a role" options={['viewer', 'editor']} bind:value={role} />`}</pre>
	</section>

	<section class="demo">
		<h2 class="label">Dropdown</h2>
		<hr class="rule" />
		<div class="demo__stage demo__stage--form">
			<div class="form-actions">
				<Dropdown
					label="My account"
					items={[
						{ label: 'Profile' },
						{ label: 'Settings' },
						{ label: 'Billing', disabled: true },
						{ label: 'Documentation', href: 'https://github.com/ritsuki-kagerou/crt-ui' }
					]}
					onselect={(item) => (menuChoice = item.label)}
				/>
			</div>
			<p class="hot" aria-live="polite">
				{menuChoice ? `You chose: ${menuChoice}` : 'Open the menu and pick an item.'}
			</p>
		</div>
		<p class="note dim">
			A menu button. Use the arrow keys, Home/End or type a letter to move; Escape closes it and
			returns focus to the button. Items are actions or links; disabled ones are skipped.
		</p>
		<pre>{`<Dropdown
	label="My account"
	items={[{ label: 'Profile' }, { label: 'Settings' }, { label: 'Docs', href: '/docs' }]}
	onselect={(item) => console.log(item.label)}
/>`}</pre>
	</section>

	<section class="demo">
		<h2 class="label">Tabs</h2>
		<hr class="rule" />
		<div class="demo__stage demo__stage--form">
			<Tabs
				label="Settings"
				bind:value={tab}
				tabs={[
					{ id: 'account', label: 'Account' },
					{ id: 'password', label: 'Password' },
					{ id: 'notifications', label: 'Notifications' }
				]}
			>
				{#snippet children(active)}
					{#if active === 'account'}
						<p>Make changes to your account here.</p>
					{:else if active === 'password'}
						<p>Change your password here.</p>
					{:else}
						<p>Choose what you want to be notified about.</p>
					{/if}
				{/snippet}
			</Tabs>
		</div>
		<p class="note dim">
			Left and Right arrows (and Home/End) move between tabs and select them. Only the active panel
			is rendered; the snippet receives its id.
		</p>
		<pre>{`<Tabs label="Settings" bind:value={tab} tabs={[{ id: 'account', label: 'Account' }, { id: 'password', label: 'Password' }]}>
	{#snippet children(active)}
		{#if active === 'account'}<Account />{:else}<Password />{/if}
	{/snippet}
</Tabs>`}</pre>
	</section>

	<section class="demo">
		<h2 class="label">Dialog</h2>
		<hr class="rule" />
		<div class="demo__stage demo__stage--form">
			<div class="form-actions">
				<Button onclick={() => (deleteOpen = true)}>Delete account</Button>
			</div>
		</div>
		<Dialog bind:open={deleteOpen} title="Are you absolutely sure?">
			<p>
				This action cannot be undone. It permanently deletes your account and removes your data.
			</p>
			{#snippet footer()}
				<Button onclick={() => (deleteOpen = false)}>Cancel</Button>
				<Button
					variant="solid"
					onclick={() => {
						deleteOpen = false;
						toast.push('Account deleted (just a demo)', { kind: 'success' });
					}}>Delete</Button
				>
			{/snippet}
		</Dialog>
		<p class="note dim">
			A modal on the native <code>&lt;dialog&gt;</code>: the platform traps focus, makes the page
			behind it inert, closes on Escape and returns focus to the button that opened it.
		</p>
		<pre>{`<Dialog bind:open title="Are you absolutely sure?">
	<p>This action cannot be undone.</p>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>Cancel</Button>
		<Button variant="solid" onclick={remove}>Delete</Button>
	{/snippet}
</Dialog>`}</pre>
	</section>

	<section class="demo">
		<h2 class="label">Toast</h2>
		<hr class="rule" />
		<div class="demo__stage demo__stage--form">
			<div class="form-actions">
				<Button onclick={() => toast.push('Your changes have been saved.')}>Show toast</Button>
				<Button onclick={() => toast.push('Profile updated.', { kind: 'success' })}>Success</Button>
				<Button onclick={() => toast.push('Could not reach the server.', { kind: 'error' })}
					>Error</Button
				>
			</div>
		</div>
		<p class="note dim">
			Mount one <code>&lt;Toaster /&gt;</code>, then call <code>toast.push()</code> from anywhere on the
			client. Messages are announced to screen readers; a toast pauses while hovered or focused, and errors
			stay until dismissed.
		</p>
		<pre>{`<Toaster />

<Button onclick={() => toast.push('Your changes have been saved.')}>Show toast</Button>`}</pre>
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
			<label class="toggle slider">
				glow
				<input
					type="range"
					min="0"
					max="30"
					step="1"
					bind:value={glow}
					disabled={!layers.vignette}
				/>
				<output class="dim">{glow}%</output>
			</label>
		</div>
		<div class="demo__tube" style:--crt-tube-glow="{glow}%">
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
			Pointer-transparent and <code>aria-hidden</code>. Mounted once in the root layout it covers
			the viewport; with <code>position="absolute"</code> it covers the nearest positioned ancestor
			instead. The glow slider sets <code>--crt-tube-glow</code> on this box; it is drawn by the vignette
			layer.
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

<Toaster />

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

	.themes {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}

	.themes__css {
		font-size: 0.9em;
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

	.demo__stage--form {
		gap: 1rem;
		max-width: 34rem;
	}

	.form-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
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

	.slider:has(input:disabled) {
		opacity: 0.45;
		cursor: default;
	}

	.slider output {
		min-width: 3ch;
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
		background: color-mix(in srgb, var(--crt-phos) 1.5%, var(--crt-bg));
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
