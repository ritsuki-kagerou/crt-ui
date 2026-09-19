<script lang="ts">
	type Props = {
		scanlines?: boolean;
		sweep?: boolean;
		flicker?: boolean;
		vignette?: boolean;
		position?: 'fixed' | 'absolute';
		class?: string;
	};

	let {
		scanlines = true,
		sweep = true,
		flicker = true,
		vignette = true,
		position = 'fixed',
		class: klass = ''
	}: Props = $props();
</script>

<div class="crt {klass}" class:crt--abs={position === 'absolute'} aria-hidden="true">
	{#if sweep}<div class="crt__sweep"></div>{/if}
	{#if scanlines}<div class="crt__lines"></div>{/if}
	{#if flicker}<div class="crt__flicker"></div>{/if}
	{#if vignette}<div class="crt__vignette"></div>{/if}
</div>

<style>
	.crt {
		position: fixed;
		inset: 0;
		z-index: var(--crt-z, 90);
		pointer-events: none;
	}

	.crt--abs {
		position: absolute;
	}

	.crt__lines {
		position: absolute;
		inset: 0;
		background:
			repeating-linear-gradient(
				0deg,
				var(--crt-scanline-ink, rgba(0, 0, 0, 0.26)) 0px,
				var(--crt-scanline-ink, rgba(0, 0, 0, 0.26)) 1px,
				transparent 1px,
				transparent var(--crt-scanline-gap, 3px)
			),
			repeating-linear-gradient(
				90deg,
				rgba(255, 0, 60, 0.045) 0px,
				rgba(0, 255, 120, 0.03) 1px,
				rgba(0, 90, 255, 0.045) 2px,
				transparent 3px
			);
		opacity: var(--crt-scanline-opacity, 0.6);
	}

	.crt__sweep {
		position: absolute;
		inset-inline: 0;
		height: var(--crt-sweep-height, 42vh);
		background: linear-gradient(
			180deg,
			transparent,
			rgba(74, 222, 128, 0.035) 46%,
			rgba(180, 255, 210, 0.055) 50%,
			rgba(74, 222, 128, 0.035) 54%,
			transparent
		);
		animation: crt-sweep var(--crt-sweep-duration, 7.5s) linear infinite;
	}

	@keyframes crt-sweep {
		0% {
			translate: 0 -50vh;
		}
		100% {
			translate: 0 115vh;
		}
	}

	.crt__vignette {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(
				125% 105% at 50% 46%,
				transparent 58%,
				rgba(0, 0, 0, var(--crt-vignette-strength, 0.55)) 100%
			),
			radial-gradient(90% 70% at 50% 46%, rgba(74, 222, 128, 0.06), transparent 70%);
	}

	.crt__flicker {
		position: absolute;
		inset: 0;
		background: var(--crt-flicker-ink, rgba(74, 222, 128, 0.025));
		mix-blend-mode: screen;
		animation: crt-flicker var(--crt-flicker-duration, 4.2s) steps(2, end) infinite;
	}

	@keyframes crt-flicker {
		0%,
		100% {opacity: 0.25;}
		7% {opacity: 0.55;}
		9% {opacity: 0.18;}
		31% {opacity: 0.42;}
		33% {opacity: 0.22;}
		67% {opacity: 0.5;}
		69% {opacity: 0.2;}
	}

	@media (prefers-reduced-motion: reduce) {
		.crt__sweep {
			display: none;
		}
		.crt__flicker {
			animation: none;
		}
	}
</style>
