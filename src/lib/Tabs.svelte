<script module lang="ts">
	export type TabItem = { id: string; label: string; disabled?: boolean };
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Tabs following the WAI-ARIA tabs pattern: Left/Right (and Home/End) move
	 * between tabs and select them, only the selected tab is in the Tab order,
	 * and the panel is a focusable region labelled by its tab. Only the active
	 * panel is rendered; `children` receives the active tab's id.
	 */
	type Props = {
		tabs: TabItem[];
		/** the selected tab's id; use `bind:value`. Defaults to the first enabled tab */
		value?: string;
		/** accessible name for the tab list */
		label?: string;
		id?: string;
		/** applied to the wrapper */
		class?: string;
		/** the active panel's content */
		children: Snippet<[string]>;
	};

	const uid = $props.id();

	let { tabs, value = $bindable(), label, id = uid, class: klass = '', children }: Props = $props();

	let active = $derived(
		tabs.find((t) => t.id === value && !t.disabled)?.id ?? tabs.find((t) => !t.disabled)?.id
	);

	let list = $state<HTMLElement>();

	function select(tabId: string) {
		value = tabId;
	}

	function handleKeydown(event: KeyboardEvent) {
		const enabled = tabs.filter((t) => !t.disabled);
		const at = enabled.findIndex((t) => t.id === active);
		let next: number | undefined;

		switch (event.key) {
			case 'ArrowRight':
				next = (at + 1) % enabled.length;
				break;
			case 'ArrowLeft':
				next = (at - 1 + enabled.length) % enabled.length;
				break;
			case 'Home':
				next = 0;
				break;
			case 'End':
				next = enabled.length - 1;
				break;
			default:
				return;
		}

		event.preventDefault();
		if (enabled.length === 0) return;
		select(enabled[next].id);
		list?.querySelector<HTMLElement>(`[data-tab="${CSS.escape(enabled[next].id)}"]`)?.focus();
	}
</script>

<div class={['tabs', klass]}>
	<div class="tabs__list" role="tablist" aria-label={label} bind:this={list}>
		{#each tabs as tab (tab.id)}
			{@const selected = tab.id === active}
			<button
				class={['tabs__tab', { 'tabs__tab--on': selected }]}
				type="button"
				role="tab"
				id="{id}-tab-{tab.id}"
				data-tab={tab.id}
				aria-selected={selected}
				aria-controls={selected ? `${id}-panel` : undefined}
				tabindex={selected ? 0 : -1}
				disabled={tab.disabled}
				onclick={() => select(tab.id)}
				onkeydown={handleKeydown}>{tab.label}</button
			>
		{/each}
	</div>
	{#if active !== undefined}
		<div
			class="tabs__panel"
			role="tabpanel"
			id="{id}-panel"
			aria-labelledby="{id}-tab-{active}"
			tabindex="0"
		>
			{@render children(active)}
		</div>
	{/if}
</div>

<style>
	.tabs {
		display: grid;
		gap: 0;
		min-width: 0;
	}

	.tabs__list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		border-bottom: 1px solid var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
	}

	.tabs__tab {
		margin: 0 0 -1px;
		padding: 0.4em 1em;
		border: 1px solid transparent;
		border-radius: 0;
		background: transparent;
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
		font-family: var(--crt-display, ui-monospace, monospace);
		font-size: 0.85em;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		text-shadow: inherit;
		cursor: pointer;
	}

	.tabs__tab:hover:not(:disabled) {
		color: var(--crt-phos-hot, #d5ffe6);
	}

	.tabs__tab--on {
		border-color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
		border-bottom-color: var(--crt-bg, #000000);
		background: var(--crt-bg, #000000);
		color: var(--crt-phos-hot, #d5ffe6);
	}

	.tabs__tab:focus-visible,
	.tabs__panel:focus-visible {
		outline: 1px solid var(--crt-phos-hot, #d5ffe6);
		outline-offset: 3px;
	}

	.tabs__tab:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.tabs__panel {
		padding-top: 1rem;
		min-width: 0;
	}
</style>
