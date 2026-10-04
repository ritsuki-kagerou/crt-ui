<script lang="ts">
	import { toast, type ToastMessage } from './toast.svelte.js';

	/**
	 * Renders the `toast` queue in two live regions that are always in the
	 * page — polite for info and success, assertive for errors — so screen
	 * readers announce each message as it arrives. A toast's timer pauses
	 * while the pointer or keyboard focus is on it. Mount one, once, near
	 * the root of the app.
	 */
	type Props = {
		position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
		/** accessible name for the notifications region */
		label?: string;
		class?: string;
	};

	let { position = 'bottom-right', label = 'Notifications', class: klass = '' }: Props = $props();

	let polite = $derived(toast.messages.filter((m) => m.kind !== 'error'));
	let urgent = $derived(toast.messages.filter((m) => m.kind === 'error'));

	// one timer per toast; it restarts after a pause rather than resuming
	function timer(node: HTMLElement, item: ToastMessage) {
		let held = 0;
		let handle: ReturnType<typeof setTimeout> | undefined;

		const stop = () => clearTimeout(handle);
		const start = () => {
			stop();
			if (item.duration > 0 && held === 0) {
				handle = setTimeout(() => toast.dismiss(item.id), item.duration);
			}
		};
		const hold = () => (held++, start());
		const release = () => ((held = Math.max(0, held - 1)), start());

		node.addEventListener('pointerenter', hold);
		node.addEventListener('pointerleave', release);
		node.addEventListener('focusin', hold);
		node.addEventListener('focusout', release);
		start();

		return () => {
			stop();
			node.removeEventListener('pointerenter', hold);
			node.removeEventListener('pointerleave', release);
			node.removeEventListener('focusin', hold);
			node.removeEventListener('focusout', release);
		};
	}
</script>

{#snippet card(item: ToastMessage)}
	<div class={['toast', `toast--${item.kind}`]} {@attach (node) => timer(node, item)}>
		<span class="toast__msg">{item.message}</span>
		<button
			class="toast__close"
			type="button"
			aria-label="Dismiss notification"
			onclick={() => toast.dismiss(item.id)}>[X]</button
		>
	</div>
{/snippet}

<section class={['toaster', `toaster--${position}`, klass]} aria-label={label}>
	<div class="toaster__list" role="status">
		{#each polite as item (item.id)}{@render card(item)}{/each}
	</div>
	<div class="toaster__list" role="alert">
		{#each urgent as item (item.id)}{@render card(item)}{/each}
	</div>
</section>

<style>
	.toaster {
		position: fixed;
		z-index: calc(var(--crt-z, 90) + 1);
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		width: min(24rem, calc(100vw - 2rem));
		pointer-events: none;
	}

	.toaster--bottom-right,
	.toaster--bottom-left {
		bottom: 1rem;
		flex-direction: column-reverse;
	}

	.toaster--top-right,
	.toaster--top-left {
		top: 1rem;
	}

	.toaster--bottom-right,
	.toaster--top-right {
		right: 1rem;
	}

	.toaster--bottom-left,
	.toaster--top-left {
		left: 1rem;
	}

	.toaster__list {
		display: flex;
		flex-direction: inherit;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
	}

	.toast {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.6rem 0.9rem;
		border: 1px solid var(--crt-phos, #4ade80);
		background: var(--crt-bg, #000000);
		color: var(--crt-phos-hot, #d5ffe6);
		font-family: var(--crt-mono, ui-monospace, monospace);
		font-size: 0.9em;
		letter-spacing: 0.06em;
		line-height: 1.45;
		text-shadow: 0 0 6px var(--crt-glow, rgba(30, 224, 124, 0.5));
		box-shadow: 0 0 10px var(--crt-glow, rgba(30, 224, 124, 0.5));
		pointer-events: auto;
		animation: toast-in 160ms steps(4, end);
	}

	.toast--success {
		border-color: var(--crt-bar, #1ee07c);
	}

	.toast--error {
		border-color: var(--crt-alert, #ff6b5e);
		color: var(--crt-alert, #ff6b5e);
		text-shadow: none;
		box-shadow: none;
	}

	.toast__msg {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.toast__close {
		flex: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		letter-spacing: 0.1em;
		text-shadow: inherit;
		opacity: 0.75;
		cursor: pointer;
	}

	.toast__close:hover {
		opacity: 1;
	}

	.toast__close:focus-visible {
		outline: 1px solid currentColor;
		outline-offset: 3px;
		opacity: 1;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(0.4rem);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.toast {
			animation: none;
		}
	}
</style>
