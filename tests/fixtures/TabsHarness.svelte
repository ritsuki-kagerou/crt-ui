<script lang="ts">
	import { Tabs } from '$lib/index.js';

	let {
		tabs,
		value = $bindable(),
		...rest
	}: {
		tabs: { id: string; label: string; disabled?: boolean }[];
		value?: string;
		id?: string;
	} = $props();
</script>

<Tabs {tabs} bind:value {...rest}>
	{#snippet children(active)}
		<p>PANEL {active}</p>
	{/snippet}
</Tabs>
