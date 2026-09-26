<script lang="ts">
	import { Boot, Crt, Meter, ScreenFrame, Typed } from '$lib/index.js';

	const BOOT_LINES = ['CRT/UI — BIOS 00.01', 'TOKENS ....... LOADED', 'READY'];
</script>

<Boot lines={BOOT_LINES} unit="TEST UNIT" duration={200} speed={1} ondone={() => {}} />

<ScreenFrame title="CAPABILITY MATRIX" code="SECTOR 02/05" footer="EOF" hint="[ESC] BACK">
	<p><Typed text="BACKEND & API" speed={1} /></p>
	<p><Typed text="HOLDING CARET" speed={1} hold /></p>
	<Meter value={0.6} label="PRIMARY" />
	<Meter value={0} label="EMPTY" cells={8} muted />
	<Meter value={1} label="FULL" cells={8} />
</ScreenFrame>

<Crt position="absolute" />
