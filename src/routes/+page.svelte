<script>
    import '$lib/tokens.css';
    import { Typed, Meter, Boot, ScreenFrame } from '$lib/index.js';

    let bootRun = $state(0);
</script>

<main class="shell">
    <h1>crt-ui sandbox</h1>

    <div class="row">
        <span style="background: var(--crt-phos)"></span>
        <span style="background: var(--crt-bar)"></span>
        <span style="background: var(--crt-phos-dim)"></span>
    </div>

    <p><Typed text="booting crt-ui ..." /></p>
    <p><Typed text="ini tulisan lambat" speed={60} /></p>
    <p><button onclick={() => console.log('kena klik')}><Typed text="test link" speed={60} /></button></p>

    <Meter value={0.8} label="PRIMARY" />
    <Meter value={0.45} label="WORKING" muted />
    <Meter value={1.7} label="CLAMP TEST" />

    <style>
        :global(body) {
                background: var(--crt-bg, #000);
                color: var(--crt-phos, #4ade80);
                font-family: var(--crt-mono, monospace);
        }
        .row { display: flex; gap: 8px; }
        .row span { width: 60px; height: 60px; }
    </style>

    <button onclick={() => bootRun += 1}>REPLAY</button>
    {#key bootRun}
    <Boot
        lines={['POST ... OK', 'MEMORY CHECK ... OK', 'LOADING CRT-UI ...']}
        unit="CRT-UI"
        ondone={() => console.log('boot selesai')}
    />
    {/key}

    <div style="--crt-screen-min-height: 12rem">
        <ScreenFrame
            title="CAPABILITY MATRIX"
            code="SECTOR 02/05"
            footer="CRT/UI DOCS"
            onback={() => {}}
        >
            <ul class="frame-list">
                <li><span class="dim">C-01</span> <span class="hot">BACKEND &amp; API</span></li>
                <li><span class="dim">C-02</span> <span class="hot">INFRASTRUCTURE</span></li>
                <li><span class="dim">C-03</span> <span class="hot">DATABASE</span></li>
            </ul>
        </ScreenFrame>
    </div>
</main>