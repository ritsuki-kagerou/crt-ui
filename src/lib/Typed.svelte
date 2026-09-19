<script lang="ts">
	/**
	 * Types a line of text out one character at a time, with a caret.
	 *
	 * SSR-safe by construction: the server renders the finished line and the
	 * client hydrates into exactly that, so there is never a markup mismatch.
	 * Typing only begins once the effect runs — i.e. after hydration.
	 */
	type Props = {
		text: string;
		/** ms per character */
		speed?: number;
		/** ms to wait before the first character */
		delay?: number;
		/** keep a blinking caret after the line finishes */
		hold?: boolean;
		class?: string;
		oncomplete?: () => void;
		/**
		 * Fired whenever new characters are drawn, with the count drawn so
		 * far — once per animation frame, not once per character, since a
		 * fast `speed` draws several characters in a single frame. Meant for
		 * driving a keystroke sound; throttle on the receiving end.
		 */
		ontick?: (drawn: number) => void;
	};

	let {
		text,
		speed = 12,
		delay = 0,
		hold = false,
		class: klass = '',
		oncomplete,
		ontick
	}: Props = $props();

	/** `null` means "whole line, no caret" — the state SSR renders. */
	let shown = $state<number | null>(null);

	$effect(() => {
		const full = text;
		const per = speed;
		const wait = delay;

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			shown = full.length;
			oncomplete?.();
			return;
		}

		// local mirror so the loop never reads reactive state (no self-dependency)
		let drawn = 0;
		let start: number | null = null;
		let frame = 0;

		shown = 0;

		const tick = (now: number) => {
			start ??= now;
			const elapsed = now - start - wait;

			if (elapsed >= 0) {
				const next = Math.min(full.length, Math.floor(elapsed / per));
				if (next !== drawn) {
					drawn = next;
					shown = next;
					ontick?.(next);
				}
				if (drawn >= full.length) {
					oncomplete?.();
					return;
				}
			}
			frame = requestAnimationFrame(tick);
		};

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});

	let visible = $derived(shown === null ? text : text.slice(0, shown));
	let typing = $derived(shown !== null && shown < text.length);
	let showCaret = $derived(typing || (hold && shown !== null));
</script>

<span class={klass}><span class="crt-sr">{text}</span><span aria-hidden="true">{visible}</span
	>{#if showCaret}<span class="crt-caret" class:crt-caret--blink={!typing} aria-hidden="true"
		></span>{/if}</span
>

<style>
	/* the full line stays in the accessibility tree; the animation is decoration */
	.crt-sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	.crt-caret {
		display: inline-block;
		width: var(--crt-caret-width, 0.58em);
		height: var(--crt-caret-height, 1.02em);
		margin-left: 0.08em;
		translate: 0 0.16em;
		background: currentColor;
		box-shadow: 0 0 8px currentColor;
	}

	.crt-caret--blink {
		animation: crt-caret-blink var(--crt-caret-blink, 1.06s) steps(1, end) infinite;
	}

	@keyframes crt-caret-blink {
		0%,
		48% {
			opacity: 1;
		}
		49%,
		100% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.crt-caret--blink {
			animation: none;
		}
	}
</style>
