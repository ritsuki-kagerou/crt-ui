<script lang="ts">
	import Typed from './Typed.svelte';

	/**
	 * A POST-style boot log: each line types itself, then hands off to the
	 * next, and a stepped progress bar closes the sequence before `ondone`
	 * fires. Under `prefers-reduced-motion` the lines resolve instantly and
	 * the bar shortens, so the sequence still reads but never crawls.
	 */
	type Props = {
		/** the log, one entry per line (empty strings are legal spacers) */
		lines: string[];
		/** header printed above the log */
		unit?: string;
		/** footer shown once the progress bar appears */
		hint?: string;
		/** ms per character */
		speed?: number;
		/** ms the progress bar takes to fill */
		duration?: number;
		/** let a key press or a pointer press end the sequence early */
		skippable?: boolean;
		/** called when the sequence finishes, or when it is skipped */
		ondone: () => void;
		/** forwarded to each line's `Typed` — see its `ontick` */
		ontick?: (drawn: number) => void;
		class?: string;
	};

	let {
		lines,
		unit = '',
		hint = 'PRESS ANY KEY TO CONTINUE',
		speed = 9,
		duration = 1100,
		skippable = true,
		ondone,
		ontick,
		class: klass = ''
	}: Props = $props();

	let idx = $state(0);
	let loading = $state(false);

	function next() {
		if (idx < lines.length - 1) idx += 1;
		else loading = true;
	}
</script>

<svelte:window
	onkeydown={skippable ? ondone : undefined}
	onpointerdown={skippable && loading ? ondone : undefined}
/>

<section class="boot {klass}" aria-label="System boot">
	{#if unit}<p class="boot__unit">{unit}</p>{/if}

	<ol class="boot__log">
		{#each lines.slice(0, idx + 1) as line, i (i)}
			<li class:boot__line--past={i !== idx}>
				{#if i === idx}
					<Typed text={line} {speed} {ontick} oncomplete={next} />
				{:else}
					{line}
				{/if}
			</li>
		{/each}
	</ol>

	{#if loading}
		<div class="boot__meter" style:--crt-boot-duration={`${duration}ms`}>
			<span class="boot__bracket">[</span>
			<span class="boot__track">
				<span class="boot__fill" onanimationend={ondone}></span>
			</span>
			<span class="boot__bracket">]</span>
		</div>
		{#if hint}<p class="boot__hint">{hint}</p>{/if}
	{/if}
</section>

<style>
	.boot {
		display: grid;
		gap: 1.4rem;
		max-width: 46ch;
	}

	.boot__unit {
		margin: 0;
		font-family: var(--crt-display, ui-monospace, monospace);
		font-weight: 700;
		letter-spacing: 0.16em;
		color: var(--crt-phos-hot, #d5ffe6);
	}

	.boot__log {
		display: grid;
		align-content: start;
		gap: 0.15rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.98em;
		letter-spacing: 0.06em;
		min-height: 9.5rem;
	}

	.boot__log li {
		min-height: 1.65em;
	}

	.boot__line--past {
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
	}

	.boot__meter {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--crt-phos-hot, #d5ffe6);
	}

	.boot__bracket {
		opacity: 0.6;
	}

	.boot__track {
		position: relative;
		flex: 1;
		height: 0.85rem;
		background: repeating-linear-gradient(
			90deg,
			var(--crt-phos-faint, rgba(74, 222, 128, 0.16)) 0 6px,
			transparent 6px 8px
		);
	}

	.boot__fill {
		position: absolute;
		inset: 0 auto 0 0;
		background: repeating-linear-gradient(
			90deg,
			var(--crt-bar, #1ee07c) 0 6px,
			transparent 6px 8px
		);
		box-shadow: 0 0 10px var(--crt-glow, rgba(30, 224, 124, 0.5));
		animation: crt-boot-fill var(--crt-boot-duration, 1100ms) steps(22, end) forwards;
	}

	@keyframes crt-boot-fill {
		from {
			width: 0%;
		}
		to {
			width: 100%;
		}
	}

	.boot__hint {
		margin: 0;
		font-size: 0.88em;
		letter-spacing: 0.2em;
		color: var(--crt-phos-dim, rgba(74, 222, 128, 0.4));
		animation: crt-boot-pulse 1.4s ease-in-out infinite;
	}

	@keyframes crt-boot-pulse {
		0%,
		100% {
			opacity: 0.35;
		}
		50% {
			opacity: 0.9;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.boot__hint {
			animation: none;
		}
		.boot__fill {
			animation-duration: 300ms;
		}
	}
</style>
