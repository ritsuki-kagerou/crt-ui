<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	/**
	 * A terminal-style push button: a phosphor outline that lights up solid
	 * on hover. Renders a native `<button>`, or an `<a>` when given `href`,
	 * so keyboard and screen-reader behaviour come from the platform.
	 * Any other attribute (`name`, `form`, `aria-*`, …) is passed through.
	 */
	type Props = Omit<HTMLButtonAttributes, 'children' | 'class'> & {
		/** `outline` for most actions, `solid` for the one primary action */
		variant?: 'outline' | 'solid';
		/** renders the button as a link; `disabled` then removes the href */
		href?: string;
		class?: string;
		children: Snippet;
	};

	let {
		variant = 'outline',
		href,
		type = 'button',
		disabled = false,
		onclick,
		class: klass = '',
		children,
		...rest
	}: Props = $props();
</script>

{#if href !== undefined}
	<a
		{...rest as HTMLAnchorAttributes}
		class={['btn', `btn--${variant}`, klass]}
		href={disabled ? undefined : href}
		onclick={disabled ? undefined : (onclick as HTMLAnchorAttributes['onclick'])}
		role={disabled ? 'link' : undefined}
		aria-disabled={disabled ? 'true' : undefined}>{@render children()}</a
	>
{:else}
	<button {...rest} class={['btn', `btn--${variant}`, klass]} {type} {disabled} {onclick}
		>{@render children()}</button
	>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
		margin: 0;
		padding: 0.45em 1.1em;
		border: 1px solid var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
		border-radius: 0;
		background: transparent;
		color: var(--crt-phos-hot, #d5ffe6);
		font-family: var(--crt-display, ui-monospace, monospace);
		font-size: 0.9em;
		font-weight: 700;
		letter-spacing: 0.16em;
		line-height: 1.4;
		text-transform: uppercase;
		text-decoration: none;
		text-shadow: inherit;
		cursor: pointer;
		transition:
			background-color 120ms linear,
			color 120ms linear,
			box-shadow 120ms linear;
	}

	.btn--solid,
	.btn:hover:not(:disabled, [aria-disabled='true']) {
		border-color: var(--crt-bar, #1ee07c);
		background: var(--crt-bar, #1ee07c);
		color: var(--crt-bg, #000000);
		text-shadow: none;
		box-shadow: 0 0 8px var(--crt-glow, rgba(30, 224, 124, 0.5));
	}

	.btn--solid:hover:not(:disabled, [aria-disabled='true']) {
		background: var(--crt-phos-hot, #d5ffe6);
		border-color: var(--crt-phos-hot, #d5ffe6);
	}

	.btn:focus-visible {
		outline: 1px solid var(--crt-phos-hot, #d5ffe6);
		outline-offset: 3px;
	}

	.btn:disabled,
	.btn[aria-disabled='true'] {
		opacity: 0.45;
		cursor: not-allowed;
	}

	@media (prefers-reduced-motion: reduce) {
		.btn {
			transition: none;
		}
	}
	:global([data-crt-motion='off']) .btn {
		transition: none;
	}
</style>
