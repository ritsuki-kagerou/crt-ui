<script lang="ts">
	import '$lib/tokens.css';
    import Crt from '$lib/Crt.svelte';

    let { children } = $props();
</script>

{@render children()}

<Crt />
