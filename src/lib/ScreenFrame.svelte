<script lang="ts">
	import type { Snippet } from 'svelte';
	import Typed from './Typed.svelte';

	/**
	 * The chrome around one screen of a terminal UI: typed title, sector
	 * code, rules top and bottom, and a back control. Content goes in the
	 * default snippet; everything else is text props.
	 */
	type Props = {
		title: string;
		/** right-aligned code in the title bar, e.g. `SECTOR 02/05` */
		code?: string;
		/** label on the back control */
		hint?: string;
		/** right-aligned footer text */
		footer?: string;
		/** omit to render the frame without a back control */
		onback?: () => void;
		/** ms per character for the title */
		titleSpeed?: number;
		/** forwarded to the title's `Typed` — see its `ontick` */
		ontick?: (drawn: number) => void;
		class?: string;
		children: Snippet;
	};

	let {
		title,
		code = '',
		hint = '[ESC] BACK',
		footer = '',
		onback,
		titleSpeed = 26,
		ontick,
		class: klass = '',
		children
	}: Props = $props();
</script>

<section class="screen {klass}">
	<div class="screen__bar">
		<h1 class="screen__title"><Typed text={title} speed={titleSpeed} {ontick} /></h1>
		{#if code}<span class="screen__code">{code}</span>{/if}
	</div>
	<hr class="screen__rule" />

	<div class="screen__body">
		{@render children()}
	</div>

	<hr class="screen__rule" />
	<footer class="screen__foot">
		{#if onback}
			<button class="screen__back" onclick={onback}>{hint}</button>
		{:else}
			<span></span>
		{/if}
		{#if footer}<span class="screen__footer-text">{footer}</span>{/if}
	</footer>
</section>

<style>
	.screen {
		display: grid;
		gap: 1.1rem;
	}

	.screen__bar {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.screen__title {
		margin: 0;
		font-family: var(--crt-display, ui-monospace, monospace);
		font-weight: 800;
		font-size: 1.05em;
		letter-spacing: 0.18em;
		color: var(--crt-phos-hot, #d5ffe6);
	}

	.screen__code {
		font-size: 0.9em;
		letter-spacing: 0.16em;
		color: var(--crt-phos-dim, rgba(74, 222, 128, 0.4));
	}

	.screen__rule {
		height: 1px;
		border: 0;
		margin: 0;
		background: linear-gradient(90deg, var(--crt-rule, rgba(74, 222, 128, 0.26)), transparent);
	}

	.screen__body {
		padding-block: 0.5rem 1.5rem;
		min-height: var(--crt-screen-min-height, 46vh);
	}

	.screen__foot {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.5rem;
		justify-content: space-between;
		font-size: 0.9em;
		letter-spacing: 0.14em;
	}

	.screen__footer-text {
		color: var(--crt-phos-dim, rgba(74, 222, 128, 0.4));
	}

	.screen__back {
		font: inherit;
		letter-spacing: inherit;
		background: none;
		border: 0;
		padding: 0;
		margin: 0;
		text-align: left;
		cursor: pointer;
		text-shadow: inherit;
		color: var(--crt-phos-hot, #d5ffe6);
		transition: opacity 120ms linear;
	}

	.screen__back:hover {
		opacity: 0.65;
	}
</style>
