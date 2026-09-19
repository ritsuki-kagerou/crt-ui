<script>
      import '$lib/tokens.css';
</script>

<h1>crt-ui sandbox</h1>

<div class="row">
      <span style="background: var(--crt-phos)"></span>
      <span style="background: var(--crt-bar)"></span>
      <span style="background: var(--crt-phos-dim)"></span>
</div>

<style>
      :global(body) {
              background: var(--crt-bg, #000);
              color: var(--crt-phos, #4ade80);
              font-family: var(--crt-mono, monospace);
      }
      .row { display: flex; gap: 8px; }
      .row span { width: 60px; height: 60px; }
</style>