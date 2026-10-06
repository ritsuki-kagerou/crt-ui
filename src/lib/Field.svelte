<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Internal: the label, frame and messages shared by `Input` and `Select`.
	 * The control itself is the snippet; it must carry `id` and point
	 * `aria-describedby` at `{id}-hint` / `{id}-error` when those exist.
	 */
	type Props = {
		id: string;
		label: string;
		hint?: string;
		error?: string;
		disabled?: boolean;
		class?: string;
		children: Snippet;
	};

	let { id, label, hint, error, disabled = false, class: klass = '', children }: Props = $props();
</script>

<div class={['field', { 'field--error': error, 'field--disabled': disabled }, klass]}>
	<label class="field__label" for={id}>{label}</label>
	<div class="field__frame">
		{@render children()}
	</div>
	{#if hint}<p class="field__msg" id="{id}-hint">{hint}</p>{/if}
	{#if error}<p class="field__msg field__msg--error" id="{id}-error">{error}</p>{/if}
</div>

<style>
	.field {
		display: grid;
		gap: 0.4rem;
		min-width: 0;
	}

	.field__label {
		font-family: var(--crt-display, ui-monospace, monospace);
		font-size: 0.8em;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
	}

	.field__frame {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.45em 0.75em;
		border: 1px solid var(--crt-rule, rgba(74, 222, 128, 0.26));
		color: var(--crt-phos-hot, #d5ffe6);
		transition:
			border-color 120ms linear,
			box-shadow 120ms linear;
	}

	.field__frame:focus-within {
		border-color: var(--crt-phos, #4ade80);
		box-shadow: 0 0 6px var(--crt-glow, rgba(30, 224, 124, 0.5));
	}

	.field--error .field__frame {
		border-color: var(--crt-alert, #ff6b5e);
	}

	.field--error .field__frame:focus-within {
		box-shadow: 0 0 6px color-mix(in srgb, var(--crt-alert, #ff6b5e) 50%, transparent);
	}

	.field--disabled {
		opacity: 0.45;
	}

	.field__msg {
		margin: 0;
		font-size: 0.82em;
		letter-spacing: 0.08em;
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
	}

	.field__msg--error {
		color: var(--crt-alert, #ff6b5e);
	}

	@media (prefers-reduced-motion: reduce) {
		.field__frame {
			transition: none;
		}
	}
	:global([data-crt-motion='off']) .field__frame {
		transition: none;
	}
</style>
