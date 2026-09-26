<script lang="ts">
	import '@ritsuki.kagerou/crt-ui/tokens.css';

	let { children } = $props();
</script>

{@render children()}

<style>
	:global(body) {
		margin: 0;
		padding: 2rem;
		background: var(--crt-bg, #000);
		color: var(--crt-phos, #4ade80);
		font-family: var(--crt-mono, ui-monospace, monospace);
	}
</style>
