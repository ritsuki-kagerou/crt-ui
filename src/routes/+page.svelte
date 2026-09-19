<script>
      import '$lib/tokens.css';
      import { Typed } from '$lib/index.js';
</script>

<h1>crt-ui sandbox</h1>

<div class="row">
      <span style="background: var(--crt-phos)"></span>
      <span style="background: var(--crt-bar)"></span>
      <span style="background: var(--crt-phos-dim)"></span>
</div>

<p><Typed text="booting crt-ui ..." /></p>
<p><Typed text="ini tulisan lambat" speed={60} /></p>
<p><a href="#"><Typed text="test link" speed={60} /></a></p>

<style>
      :global(body) {
              background: var(--crt-bg, #000);
              color: var(--crt-phos, #4ade80);
              font-family: var(--crt-mono, monospace);
      }
      .row { display: flex; gap: 8px; }
      .row span { width: 60px; height: 60px; }
</style>