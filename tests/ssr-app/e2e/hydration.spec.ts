import { expect, test, type Page } from '@playwright/test';

const HYDRATION_CODES = [
	'hydration_mismatch',
	'hydration_attribute_changed',
	'hydration_html_changed'
];

const IGNORED = [/\[vite\]/i, /Download the (React|Svelte) DevTools/i];

function body(html: string): string {
	return html.slice(html.indexOf('<body'));
}

type Noise = { warnings: string[]; errors: string[] };

function listen(page: Page): Noise {
	const noise: Noise = { warnings: [], errors: [] };

	page.on('console', (msg) => {
		const text = msg.text();
		if (IGNORED.some((re) => re.test(text))) return;
		if (msg.type() === 'warning') noise.warnings.push(text);
		if (msg.type() === 'error') noise.errors.push(text);
	});
	page.on('pageerror', (err) => noise.errors.push(String(err)));

	return noise;
}

test.describe('server-rendered markup', () => {
	test('is the settled, animation-free state of every component', async ({ request, baseURL }) => {
		const markup = body(await (await request.get(baseURL!)).text());

		expect(markup).toContain('BACKEND &amp; API');
		expect(markup).toContain('HOLDING');
		expect(markup).not.toContain('crt-caret');

		expect(markup).toContain('CRT/UI — BIOS 00.01');
		expect(markup).not.toContain('TOKENS ....... LOADED');
		expect(markup).not.toContain('boot__meter');

		expect(markup).toContain('RUNNING');
		expect(markup).toContain('IDLE');

		expect(markup).toContain('aria-valuenow="25"');
		expect(markup).toContain('CAPABILITY MATRIX');
		expect(markup).toContain('SECTOR 02/05');
		expect(markup).toContain('crt__lines');
	});

	test('is byte-identical across requests', async ({ request, baseURL }) => {
		const first = await (await request.get(baseURL!)).text();
		const second = await (await request.get(baseURL!)).text();

		expect(second).toBe(first);
	});
});

test.describe('hydration', () => {
	test('completes with no warnings and no errors', async ({ page }) => {
		const noise = listen(page);

		await page.goto('/');
		await expect(page.getByTestId('boot-state')).toHaveText('DONE');

		const hydrationIssues = [...noise.warnings, ...noise.errors].filter((text) =>
			HYDRATION_CODES.some((code) => text.includes(code))
		);

		expect(hydrationIssues, 'Svelte reported a hydration problem').toEqual([]);
		expect(noise.errors, 'the page logged errors').toEqual([]);
		expect(noise.warnings, 'the page logged warnings').toEqual([]);
	});

	test('leaves every component working afterwards', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByTestId('boot-state')).toHaveText('DONE');
		await expect(page.locator('.boot__log li')).toHaveCount(3);
		expect(Number(await page.getByTestId('boot-ticks').innerText())).toBeGreaterThan(0);

		await expect(page.locator('[data-testid="typed-hold"] .crt-caret')).toBeVisible();
		await expect(page.getByTestId('typed-plain')).toContainText('BACKEND & API');

		const meter = page.locator('[data-testid="meter-level"] [role="meter"]');
		await expect(meter).toHaveAttribute('aria-valuenow', '25');
		await page.getByTestId('raise').click();
		await expect(meter).toHaveAttribute('aria-valuenow', '75');
		await expect(page.locator('[data-testid="meter-level"] .meter__cell--on')).toHaveCount(18);

		await expect(page.getByTestId('back-state')).toHaveText('IDLE');
		await page.locator('button.screen__back').click();
		await expect(page.getByTestId('back-state')).toHaveText('BACK');

		for (const layer of ['crt__sweep', 'crt__lines', 'crt__flicker', 'crt__vignette']) {
			await expect(page.locator(`.${layer}`)).toBeAttached();
		}
		await expect(page.locator('.crt')).toHaveCSS('pointer-events', 'none');
	});
});
