<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Field from './Field.svelte';

	/**
	 * A labelled text field behind a terminal prompt. The label is always
	 * visible and tied to the input; `hint` and `error` are linked through
	 * `aria-describedby`, and `error` also sets `aria-invalid`. Any other
	 * input attribute (`type`, `name`, `placeholder`, `required`, …) is
	 * passed through to the `<input>`.
	 */
	type Props = Omit<HTMLInputAttributes, 'value' | 'class' | 'children'> & {
		/** visible label */
		label: string;
		/** the field's text; use `bind:value` */
		value?: string;
		/** help text under the field */
		hint?: string;
		/** error text under the field; marks the input invalid */
		error?: string;
		/** decorative prefix before the text; `''` hides it */
		prompt?: string;
		/** applied to the wrapper */
		class?: string;
	};

	const uid = $props.id();

	let {
		label,
		value = $bindable(''),
		hint,
		error,
		prompt = '>',
		id = uid,
		type = 'text',
		disabled = false,
		class: klass = '',
		...rest
	}: Props = $props();

	let describedBy = $derived(
		[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
	);
</script>

<Field id={id!} {label} {hint} {error} disabled={!!disabled} class={klass}>
	{#if prompt}<span class="input__prompt" aria-hidden="true">{prompt}</span>{/if}
	<input
		{...rest}
		class="input"
		{id}
		{type}
		{disabled}
		bind:value
		aria-describedby={describedBy}
		aria-invalid={error ? 'true' : undefined}
	/>
</Field>

<style>
	.input__prompt {
		flex: none;
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
	}

	.input {
		flex: 1;
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
		outline: none;
		background: transparent;
		color: inherit;
		font: inherit;
		letter-spacing: 0.06em;
		text-shadow: inherit;
		caret-color: var(--crt-bar, #1ee07c);
	}

	.input::placeholder {
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
		opacity: 1;
	}

	.input:disabled {
		cursor: not-allowed;
	}
</style>
