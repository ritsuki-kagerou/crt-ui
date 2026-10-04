<script module lang="ts">
	export type DropdownItem = {
		label: string;
		/** renders the item as a link */
		href?: string;
		disabled?: boolean;
		onselect?: () => void;
	};
</script>

<script lang="ts">
	import Button from './Button.svelte';

	/**
	 * A menu button following the WAI-ARIA menu-button pattern. Enter, Space
	 * or Down opens the menu on the first item (Up on the last); arrows,
	 * Home/End and typing a letter move between items; Escape closes it and
	 * returns focus to the button; Tab or a click outside closes it. Items
	 * are actions (`onselect`) or links (`href`); disabled ones are skipped.
	 */
	type Props = {
		/** the trigger button's text */
		label: string;
		items: DropdownItem[];
		/** runs for every selected item, after the item's own `onselect` */
		onselect?: (item: DropdownItem) => void;
		/** which edge of the trigger the menu lines up with */
		align?: 'start' | 'end';
		variant?: 'outline' | 'solid';
		id?: string;
		/** applied to the wrapper */
		class?: string;
	};

	const uid = $props.id();

	let {
		label,
		items,
		onselect,
		align = 'start',
		variant = 'outline',
		id = uid,
		class: klass = ''
	}: Props = $props();

	let open = $state(false);
	let entry = $state<'first' | 'last'>('first');
	let root = $state<HTMLElement>();

	const options = () =>
		Array.from(
			root?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []
		);

	const trigger = () => root?.querySelector<HTMLElement>('.dropdown__trigger');

	// focus moves into the menu once it is rendered
	$effect(() => {
		if (!open) return;
		const found = options();
		(entry === 'last' ? found.at(-1) : found[0])?.focus();
	});

	function show(from: 'first' | 'last') {
		entry = from;
		open = true;
	}

	function close(restoreFocus = true) {
		open = false;
		if (restoreFocus) trigger()?.focus();
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') show('first');
		else if (event.key === 'ArrowUp') show('last');
		else return;
		event.preventDefault();
	}

	function handleMenuKeydown(event: KeyboardEvent) {
		const found = options();
		const at = found.indexOf(document.activeElement as HTMLElement);

		switch (event.key) {
			case 'ArrowDown':
				found[(at + 1) % found.length]?.focus();
				break;
			case 'ArrowUp':
				found[(at - 1 + found.length) % found.length]?.focus();
				break;
			case 'Home':
				found[0]?.focus();
				break;
			case 'End':
				found.at(-1)?.focus();
				break;
			case 'Escape':
				close();
				break;
			case 'Tab':
				close(false);
				return;
			default: {
				// typeahead: the next item whose label starts with the letter
				if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
				const letter = event.key.toLowerCase();
				const ordered = [...found.slice(at + 1), ...found.slice(0, at + 1)];
				ordered.find((el) => el.textContent?.trim().toLowerCase().startsWith(letter))?.focus();
				break;
			}
		}
		event.preventDefault();
	}

	function choose(item: DropdownItem) {
		item.onselect?.();
		onselect?.(item);
		close();
	}
</script>

<svelte:window
	onpointerdown={(event) => {
		if (open && !root?.contains(event.target as Node)) open = false;
	}}
/>

<span class={['dropdown', klass]} bind:this={root}>
	<Button
		class="dropdown__trigger"
		{variant}
		id="{id}-trigger"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls={open ? `${id}-menu` : undefined}
		onclick={() => (open ? close(false) : show('first'))}
		onkeydown={handleTriggerKeydown}>{label} <span aria-hidden="true">▾</span></Button
	>
	{#if open}
		<!-- the menu's keys are handled on its items, which hold focus -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<ul
			class={['dropdown__menu', `dropdown__menu--${align}`]}
			role="menu"
			id="{id}-menu"
			aria-labelledby="{id}-trigger"
			onkeydown={handleMenuKeydown}
		>
			{#each items as item (item.label)}
				<li role="none">
					{#if item.href !== undefined}
						<a
							class="dropdown__item"
							role="menuitem"
							tabindex="-1"
							href={item.disabled ? undefined : item.href}
							aria-disabled={item.disabled ? 'true' : undefined}
							onclick={item.disabled ? (e) => e.preventDefault() : () => choose(item)}
							>{item.label}</a
						>
					{:else}
						<button
							class="dropdown__item"
							type="button"
							role="menuitem"
							tabindex="-1"
							aria-disabled={item.disabled ? 'true' : undefined}
							onclick={item.disabled ? undefined : () => choose(item)}>{item.label}</button
						>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</span>

<style>
	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown__menu {
		position: absolute;
		top: 100%;
		z-index: 2;
		min-width: 100%;
		margin: 0.4em 0 0;
		padding: 0.25em 0;
		border: 1px solid var(--crt-phos, #4ade80);
		background: var(--crt-bg, #000000);
		box-shadow: 0 0 10px var(--crt-glow, rgba(30, 224, 124, 0.5));
		list-style: none;
	}

	.dropdown__menu--start {
		left: 0;
	}

	.dropdown__menu--end {
		right: 0;
	}

	.dropdown__item {
		display: block;
		box-sizing: border-box;
		width: 100%;
		margin: 0;
		padding: 0.4em 0.9em;
		border: 0;
		border-radius: 0;
		background: transparent;
		color: var(--crt-phos-hot, #d5ffe6);
		font-family: var(--crt-mono, ui-monospace, monospace);
		font-size: 0.9em;
		letter-spacing: 0.08em;
		text-align: left;
		text-decoration: none;
		text-shadow: inherit;
		white-space: nowrap;
		cursor: pointer;
	}

	.dropdown__item:not([aria-disabled='true']):is(:hover, :focus-visible) {
		outline: none;
		background: var(--crt-bar, #1ee07c);
		color: var(--crt-bg, #000000);
		text-shadow: none;
	}

	.dropdown__item[aria-disabled='true'] {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
