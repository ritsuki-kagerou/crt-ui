<script lang="ts">
	import {
		Boot,
		Button,
		Crt,
		Input,
		Meter,
		ScreenFrame,
		Select,
		Typed
	} from '@ritsuki.kagerou/crt-ui';

	const BOOT_LINES = ['CRT/UI — BIOS 00.01', 'TOKENS ....... LOADED', 'READY'];

	let booted = $state(false);
	let ticks = $state(0);
	let backPressed = $state(false);
	let level = $state(0.25);
	let callsign = $state('RK');
	let phosphor = $state('amber');
	let sector = $state('');
	let executed = $state(0);
</script>

<Boot
	lines={BOOT_LINES}
	unit="TEST UNIT"
	speed={2}
	duration={150}
	skippable={false}
	ondone={() => (booted = true)}
	ontick={(drawn) => (ticks = drawn)}
/>

<p data-testid="boot-state">{booted ? 'DONE' : 'RUNNING'}</p>
<p data-testid="boot-ticks">{ticks}</p>

<ScreenFrame
	title="CAPABILITY MATRIX"
	code="SECTOR 02/05"
	footer="EOF"
	onback={() => (backPressed = true)}
>
	<p data-testid="typed-plain"><Typed text="BACKEND &amp; API" speed={8} /></p>
	<p data-testid="typed-hold"><Typed text="HOLDING" speed={8} hold /></p>

	<span data-testid="meter-level"><Meter value={level} label="LEVEL" /></span>
	<span data-testid="meter-empty"><Meter value={0} label="EMPTY" cells={8} muted /></span>
	<span data-testid="meter-full"><Meter value={1} label="FULL" cells={8} /></span>
</ScreenFrame>

<p data-testid="back-state">{backPressed ? 'BACK' : 'IDLE'}</p>

<form data-testid="form" onsubmit={(e) => e.preventDefault()}>
	<Input label="CALLSIGN" bind:value={callsign} hint="UP TO 8 CHARACTERS" />
	<Input label="PASSWORD" type="password" prompt="" error="TOO SHORT" />
	<Select
		label="PHOSPHOR"
		options={['green', { value: 'amber', label: 'AMBER' }, { value: 'white', disabled: true }]}
		bind:value={phosphor}
	/>
	<Select label="SECTOR" options={['01', '02']} placeholder="CHOOSE" bind:value={sector} />
	<Button variant="solid" onclick={() => executed++}>EXECUTE</Button>
	<Button href="/docs">READ THE DOCS</Button>
	<Button disabled>OFFLINE</Button>
</form>

<p data-testid="form-state">{callsign}|{phosphor}|{sector}|{executed}</p>

<button data-testid="raise" onclick={() => (level = 0.75)}>RAISE LEVEL</button>

<Crt />
