<script lang="ts">
	/**
	 * The tube itself: scanlines, a slow beam sweep, phosphor flicker and a
	 * vignette, plus optional noise and a curved bezel. Purely decorative and
	 * pointer-transparent — mount it once, last in the layout, and it sits over
	 * everything.
	 */
	type Props = {
		/** horizontal scanlines + RGB triad mask */
		scanlines?: boolean;
		/** the slow vertical beam pass */
		sweep?: boolean;
		/** phosphor brightness jitter */
		flicker?: boolean;
		/** tube curvature falloff at the edges */
		vignette?: boolean;
		/** film-grain static over the screen (off by default) */
		noise?: boolean;
		/** rounded glass corners and bezel shading — a frame effect, content is not warped (off by default) */
		curvature?: boolean;
		/** `fixed` covers the viewport, `absolute` the nearest positioned ancestor */
		position?: 'fixed' | 'absolute';
		class?: string;
	};

	let {
		scanlines = true,
		sweep = true,
		flicker = true,
		vignette = true,
		noise = false,
		curvature = false,
		position = 'fixed',
		class: klass = ''
	}: Props = $props();
</script>

<div class="crt {klass}" class:crt--abs={position === 'absolute'} aria-hidden="true">
	{#if sweep}<div class="crt__sweep"></div>{/if}
	{#if scanlines}<div class="crt__lines"></div>{/if}
	{#if flicker}<div class="crt__flicker"></div>{/if}
	{#if vignette}<div class="crt__vignette"></div>{/if}
	{#if noise}<div class="crt__noise"></div>{/if}
	{#if curvature}<div class="crt__curve"></div>{/if}
</div>

<style>
	.crt {
		position: fixed;
		inset: 0;
		z-index: var(--crt-z, 90);
		pointer-events: none;
		/* the noise tile overscans and the curve mask spreads past the box */
		overflow: hidden;
	}

	.crt--abs {
		position: absolute;
	}

	/* scanlines + phosphor triads */
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

	/* slow sweep of the electron beam — tinted by the phosphor tokens, so a
	   re-skinned tube sweeps in its own colour */
	.crt__sweep {
		position: absolute;
		inset-inline: 0;
		height: var(--crt-sweep-height, 42vh);
		background: linear-gradient(
			180deg,
			transparent,
			color-mix(in srgb, var(--crt-phos, #4ade80) 3.5%, transparent) 46%,
			color-mix(in srgb, var(--crt-phos-hot, #d5ffe6) 5.5%, transparent) 50%,
			color-mix(in srgb, var(--crt-phos, #4ade80) 3.5%, transparent) 54%,
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

	/* tube curvature + burn-in falloff, over a phosphor glow whose strength
	   is --crt-tube-glow */
	.crt__vignette {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(
				125% 105% at 50% 46%,
				transparent 58%,
				rgba(0, 0, 0, var(--crt-vignette-strength, 0.55)) 100%
			),
			radial-gradient(
				90% 70% at 50% 46%,
				color-mix(in srgb, var(--crt-phos, #4ade80) var(--crt-tube-glow, 6%), transparent),
				transparent 70%
			);
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
		100% {
			opacity: 0.25;
		}
		7% {
			opacity: 0.55;
		}
		9% {
			opacity: 0.18;
		}
		31% {
			opacity: 0.42;
		}
		33% {
			opacity: 0.22;
		}
		67% {
			opacity: 0.5;
		}
		69% {
			opacity: 0.2;
		}
	}

	/* film grain: a tiled turbulence texture, jumped between a few offsets */
	.crt__noise {
		position: absolute;
		inset: -200px;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
		opacity: var(--crt-noise-opacity, 0.07);
		mix-blend-mode: screen;
		animation: crt-noise var(--crt-noise-duration, 0.8s) steps(1, end) infinite;
	}

	@keyframes crt-noise {
		0% {
			translate: 0 0;
		}
		20% {
			translate: -60px 40px;
		}
		40% {
			translate: 80px -90px;
		}
		60% {
			translate: -120px -30px;
		}
		80% {
			translate: 50px 110px;
		}
	}

	/* curved glass: rounded corners (the spread shadow blacks out everything
	   outside them) over inward shading along the bezel */
	.crt__curve {
		position: absolute;
		inset: 0;
		border-radius: var(--crt-curvature-radius, 2.5rem);
		box-shadow:
			0 0 0 100vmax var(--crt-bg, #000),
			inset 0 0 calc(var(--crt-curvature-radius, 2.5rem) * 2)
				rgba(0, 0, 0, var(--crt-curvature-shade, 0.5));
	}

	@media (prefers-reduced-motion: reduce) {
		.crt__sweep {
			display: none;
		}
		.crt__noise {
			animation: none;
		}
		.crt__flicker {
			animation: none;
		}
	}
</style>
