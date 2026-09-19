<script lang="ts">
	import '$lib/tokens.css';
    import { Crt } from '$lib/index.js';

    let { children } = $props();
</script>

{@render children()}

<Crt />
