import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

test.describe('theming', () => {
	test('re-skinning --crt-phos re-colours everything derived from it', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('boot-state')).toHaveText('DONE');

		const read = () =>
			page.evaluate(() => {
				const root = getComputedStyle(document.documentElement);
				const bg = (sel: string) => getComputedStyle(document.querySelector(sel)!).backgroundImage;
				return {
					sweep: bg('.crt__sweep'),
					glow: bg('.crt__vignette'),
					rule: root.getPropertyValue('--crt-rule'),
					dim: root.getPropertyValue('--crt-phos-dim'),
					flicker: root.getPropertyValue('--crt-flicker-ink'),
					glowToken: root.getPropertyValue('--crt-glow')
				};
			});

		const green = await read();
		await page.evaluate(() => {
			const root = document.documentElement.style;
			root.setProperty('--crt-phos', '#ffb000');
			root.setProperty('--crt-phos-hot', '#ffe9bf');
			root.setProperty('--crt-bar', '#ffc23d');
		});
		const amber = await read();

		for (const key of Object.keys(green) as (keyof typeof green)[]) {
			expect(amber[key], `${key} did not follow the phosphor tokens`).not.toBe(green[key]);
		}
	});
});

test.describe('form components', () => {
	test('keep their server-rendered ids and state through hydration', async ({
		page,
		request,
		baseURL
	}) => {
		const markup = body(await (await request.get(baseURL!)).text());
		const serverIds = [...markup.matchAll(/<(?:input|select)[^>]*\sid="([^"]+)"/g)].map(
			(m) => m[1]
		);
		expect(serverIds).toHaveLength(4);
		expect(new Set(serverIds).size).toBe(4);

		await page.goto('/');
		await expect(page.getByTestId('boot-state')).toHaveText('DONE');

		const clientIds = await page
			.locator('[data-testid="form"] :is(input, select)')
			.evaluateAll((els) => els.map((el) => el.id));
		expect(clientIds).toEqual(serverIds);

		await expect(page.getByTestId('form-state')).toHaveText('RK|amber||0');
		await expect(page.getByLabel('PHOSPHOR')).toHaveValue('amber');
		await expect(page.getByLabel('SECTOR')).toHaveValue('');
	});

	test('work after hydration', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('boot-state')).toHaveText('DONE');

		await page.getByLabel('CALLSIGN').fill('RK-9000');
		await page.getByLabel('PHOSPHOR').selectOption('green');
		await page.getByLabel('SECTOR').selectOption('02');
		await page.getByRole('button', { name: 'EXECUTE' }).click();
		await expect(page.getByTestId('form-state')).toHaveText('RK-9000|green|02|1');

		await expect(page.getByLabel('CALLSIGN')).toHaveAccessibleDescription('UP TO 8 CHARACTERS');
		await expect(page.getByLabel('PASSWORD')).toHaveAttribute('aria-invalid', 'true');
		await expect(page.getByLabel('PASSWORD')).toHaveAccessibleDescription('TOO SHORT');
		await expect(page.getByRole('button', { name: 'OFFLINE' })).toBeDisabled();
	});

	test('theme the open select list where the browser allows it', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('boot-state')).toHaveText('DONE');

		const select = page.getByLabel('PHOSPHOR');
		const supported = await page.evaluate(() => CSS.supports('appearance', 'base-select'));
		test.skip(!supported, 'this browser has no customizable select');

		await expect(select).toHaveCSS('appearance', 'base-select');
		await select.click();
		const green = page.getByRole('option', { name: 'green' });
		await expect(green).toBeVisible();
		await green.hover();

		const look = await page.evaluate(() => {
			const s = document.querySelector('[data-testid="form"] select')!;
			const picker = getComputedStyle(s, '::picker(select)');
			const option = [...s.querySelectorAll('option')].find((o) => o.value === 'green')!;
			return {
				pickerBg: picker.backgroundColor,
				optionBg: getComputedStyle(option).backgroundColor
			};
		});
		expect(look.pickerBg).toBe('rgb(0, 0, 0)');
		// hovered option lights up in --crt-bar (#1ee07c)
		expect(look.optionBg).toBe('rgb(30, 224, 124)');

		await green.click();
		await expect(page.getByTestId('form-state')).toContainText('|green|');
	});

	test('reach every control with the keyboard', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('boot-state')).toHaveText('DONE');

		await page.getByLabel('CALLSIGN').focus();
		const order: string[] = [];
		for (let i = 0; i < 5; i++) {
			await page.keyboard.press('Tab');
			order.push(
				await page.evaluate(
					() => document.activeElement?.id || document.activeElement?.textContent?.trim() || ''
				)
			);
		}
		const ids = await page
			.locator('[data-testid="form"] :is(input, select)')
			.evaluateAll((els) => els.map((el) => el.id));
		// the disabled button is skipped
		expect(order).toEqual([ids[1], ids[2], ids[3], 'EXECUTE', 'READ THE DOCS']);
	});
});

test.describe('accessibility (axe, real browser)', () => {
	test('the page has no WCAG A/AA violations, colour contrast included', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('boot-state')).toHaveText('DONE');

		const { violations } = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();

		expect(
			violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
		).toEqual([]);
	});
});
