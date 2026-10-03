<script module lang="ts">
	export type SelectOption = string | { value: string; label?: string; disabled?: boolean };
</script>

<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import Field from './Field.svelte';

	/**
	 * A labelled native `<select>` in the same frame as `Input`. Native on
	 * purpose: the platform handles keyboard, touch and screen readers.
	 * Options are plain strings or `{ value, label, disabled }` objects.
	 * Any other select attribute (`name`, `required`, …) is passed through.
	 */
	type Props = Omit<HTMLSelectAttributes, 'value' | 'class' | 'children' | 'multiple'> & {
		/** visible label */
		label: string;
		options: SelectOption[];
		/** the selected option's value; use `bind:value` */
		value?: string;
		/** a disabled first option shown while `value` is empty */
		placeholder?: string;
		/** help text under the field */
		hint?: string;
		/** error text under the field; marks the select invalid */
		error?: string;
		/** applied to the wrapper */
		class?: string;
	};

	const uid = $props.id();

	let {
		label,
		options,
		value = $bindable(''),
		placeholder,
		hint,
		error,
		id = uid,
		disabled = false,
		class: klass = '',
		...rest
	}: Props = $props();

	let items = $derived(
		options.map((o) =>
			typeof o === 'string'
				? { value: o, label: o, disabled: false }
				: { value: o.value, label: o.label ?? o.value, disabled: !!o.disabled }
		)
	);

	let describedBy = $derived(
		[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
	);
</script>

<Field id={id!} {label} {hint} {error} disabled={!!disabled} class={klass}>
	<select
		{...rest}
		class="select"
		{id}
		{disabled}
		bind:value
		aria-describedby={describedBy}
		aria-invalid={error ? 'true' : undefined}
	>
		{#if placeholder !== undefined}
			<option value="" disabled>{placeholder}</option>
		{/if}
		{#each items as item (item.value)}
			<option value={item.value} disabled={item.disabled}>{item.label}</option>
		{/each}
	</select>
	<span class="select__arrow" aria-hidden="true">▾</span>
</Field>

<style>
	.select {
		flex: 1;
		min-width: 0;
		margin: 0;
		padding: 0 1.5em 0 0;
		border: 0;
		outline: none;
		background: transparent;
		color: inherit;
		font: inherit;
		letter-spacing: 0.06em;
		text-shadow: inherit;
		appearance: none;
		cursor: pointer;
	}

	.select option {
		background: var(--crt-bg, #000000);
		color: var(--crt-phos-hot, #d5ffe6);
	}

	.select:disabled {
		cursor: not-allowed;
	}

	.select__arrow {
		position: absolute;
		right: 0.75em;
		pointer-events: none;
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
	}

	/*
	 * Where the browser supports customizable selects (Chrome/Edge 135+), the
	 * open list is themed too. Elsewhere this block is ignored and the list
	 * stays the platform's own popup.
	 */
	@supports (appearance: base-select) {
		.select,
		.select::picker(select) {
			appearance: base-select;
		}

		.select::picker-icon {
			display: none;
		}

		.select::picker(select) {
			margin-block: 0.4em;
			padding-block: 0.25em;
			border: 1px solid var(--crt-phos, #4ade80);
			background: var(--crt-bg, #000000);
			color: var(--crt-phos-hot, #d5ffe6);
			box-shadow: 0 0 10px var(--crt-glow, rgba(30, 224, 124, 0.5));
		}

		.select option {
			gap: 0.6em;
			padding: 0.35em 0.75em;
			background: transparent;
			font: inherit;
			letter-spacing: 0.06em;
		}

		.select option::checkmark {
			content: '>';
			color: var(--crt-bar, #1ee07c);
		}

		.select option:not(:checked)::checkmark {
			visibility: hidden;
		}

		.select option:not(:disabled):is(:hover, :focus-visible) {
			outline: none;
			background: var(--crt-bar, #1ee07c);
			color: var(--crt-bg, #000000);
			text-shadow: none;
		}

		.select option:not(:disabled):is(:hover, :focus-visible)::checkmark {
			color: inherit;
		}

		.select option:disabled {
			color: var(--crt-phos-dim, rgba(74, 222, 128, 0.4));
		}
	}
</style>
