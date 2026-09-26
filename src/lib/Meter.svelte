<script lang="ts">
	/**
	 * A segmented bar-graph readout. Cells light left to right on a stagger,
	 * so a row of meters reads as a machine filling in rather than a static
	 * chart. The value is exposed to assistive tech as an ARIA meter.
	 */
	type Props = {
		/** fill fraction, 0–1 (clamped) */
		value: number;
		/** text label printed after the bar */
		label?: string;
		/** render the label in the secondary colour */
		muted?: boolean;
		/** number of cells in the bar */
		cells?: number;
		/** ms before the first cell lights */
		delay?: number;
		/** ms between cells */
		stagger?: number;
		class?: string;
	};

	let {
		value,
		label = '',
		muted = false,
		cells = 24,
		delay = 0,
		stagger = 26,
		class: klass = ''
	}: Props = $props();

	let fraction = $derived(Math.min(1, Math.max(0, value)));
	let filled = $derived(Math.round(fraction * cells));
	let track = $derived(Array.from({ length: cells }, (_, i) => i));
	let percent = $derived(Math.round(fraction * 100));
</script>

<span
	class="meter {klass}"
	style:--crt-meter-delay={`${delay}ms`}
	style:--crt-meter-step={`${stagger}ms`}
>
	<span
		class="meter__bar"
		role="meter"
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={percent}
		aria-label={label || `${percent}%`}
	>
		{#each track as i (i)}
			<span class="meter__cell" class:meter__cell--on={i < filled} style:--i={i}></span>
		{/each}
	</span>
	{#if label}
		<span class="meter__label" class:meter__label--muted={muted}>{label}</span>
	{/if}
</span>

<style>
	.meter {
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}

	.meter__bar {
		display: flex;
		gap: var(--crt-cell-gap, 2px);
	}

	.meter__cell {
		width: var(--crt-cell-width, 6px);
		height: var(--crt-cell-height, 12px);
		background: var(--crt-phos-faint, rgba(74, 222, 128, 0.16));
	}

	.meter__cell--on {
		background: var(--crt-bar, #1ee07c);
		box-shadow: 0 0 6px var(--crt-glow, rgba(30, 224, 124, 0.5));
		animation: crt-cell-in 1ms linear backwards;
		animation-delay: calc(var(--crt-meter-delay) + var(--i) * var(--crt-meter-step));
	}

	@keyframes crt-cell-in {
		from {
			background: var(--crt-phos-faint, rgba(74, 222, 128, 0.16));
			box-shadow: none;
		}
	}

	.meter__label {
		font-family: var(--crt-display, ui-monospace, monospace);
		font-weight: 700;
		font-size: 0.76em;
		letter-spacing: 0.16em;
		color: var(--crt-phos-hot, #d5ffe6);
	}

	.meter__label--muted {
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
	}

	@media (prefers-reduced-motion: reduce) {
		.meter__cell--on {
			animation: none;
		}
	}
</style>
