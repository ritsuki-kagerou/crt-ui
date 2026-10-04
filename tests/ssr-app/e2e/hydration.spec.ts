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

test.describe('overlay and navigation components', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('boot-state')).toHaveText('DONE');
	});

	const inside = (page: Page, selector: string) =>
		page.evaluate((sel) => !!document.activeElement?.closest(sel), selector);

	test('Dialog is closed in the server markup and modal once opened', async ({
		page,
		request,
		baseURL
	}) => {
		const markup = body(await (await request.get(baseURL!)).text());
		expect(markup).toMatch(/<dialog(?![^>]* open)[^>]*>/);

		const dialog = page.getByRole('dialog', { name: 'CONFIRM PURGE' });
		await expect(dialog).toBeHidden();

		await page.getByRole('button', { name: 'OPEN DIALOG' }).click();
		await expect(dialog).toBeVisible();
		expect(await inside(page, 'dialog')).toBe(true);

		// focus never lands on the page behind it. After the last control Chromium hands
		// focus to its own UI, which leaves `document.body` active, and then wraps back in.
		const seen = new Set<string>();
		for (let i = 0; i < 8; i++) {
			await page.keyboard.press('Tab');
			const where = await page.evaluate(() =>
				document.activeElement === document.body
					? 'browser'
					: document.activeElement?.closest('dialog')
						? 'dialog'
						: 'page'
			);
			seen.add(where);
		}
		expect([...seen].sort()).toEqual(['browser', 'dialog']);
	});

	test('Dialog closes on Escape and gives focus back to its opener', async ({ page }) => {
		const opener = page.getByRole('button', { name: 'OPEN DIALOG' });
		await opener.click();
		await expect(page.getByRole('dialog')).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toBeHidden();
		await expect(opener).toBeFocused();
		await expect(page.getByTestId('overlay-state')).toHaveText('status|NONE|1|0');
	});

	test('Dialog closes on a backdrop click and on its own buttons, and can reopen', async ({
		page
	}) => {
		const opener = page.getByRole('button', { name: 'OPEN DIALOG' });
		const dialog = page.getByRole('dialog');

		await opener.click();
		await page.mouse.click(4, 4);
		await expect(dialog).toBeHidden();

		await opener.click();
		await dialog.getByRole('button', { name: 'CANCEL' }).click();
		await expect(dialog).toBeHidden();

		await opener.click();
		await dialog.getByRole('button', { name: 'PURGE' }).click();
		await expect(dialog).toBeHidden();

		await opener.click();
		await dialog.getByRole('button', { name: /CLOSE/ }).click();
		await expect(dialog).toBeHidden();
		await expect(page.getByTestId('overlay-state')).toHaveText('status|NONE|4|1');
	});

	test('Tabs: server-rendered selection, then arrow keys, skipping the disabled tab', async ({
		page,
		request,
		baseURL
	}) => {
		const markup = body(await (await request.get(baseURL!)).text());
		expect(markup).toContain('PANEL status');
		expect(markup).not.toContain('PANEL log');

		const status = page.getByRole('tab', { name: 'STATUS' });
		await expect(status).toHaveAttribute('aria-selected', 'true');
		await status.focus();

		await page.keyboard.press('ArrowRight');
		await expect(page.getByRole('tab', { name: 'LOG' })).toBeFocused();
		await expect(page.getByTestId('panel')).toHaveText('PANEL log');

		await page.keyboard.press('ArrowRight'); // KEYS is disabled
		await expect(page.getByRole('tab', { name: 'ABOUT' })).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await expect(status).toBeFocused();
		await page.keyboard.press('End');
		await expect(page.getByTestId('panel')).toHaveText('PANEL about');
		await page.keyboard.press('Home');
		await expect(page.getByTestId('panel')).toHaveText('PANEL status');

		await page.getByRole('tab', { name: 'LOG' }).click();
		await expect(page.getByTestId('overlay-state')).toContainText('log|');
		await expect(page.getByRole('tabpanel')).toHaveAccessibleName('LOG');
	});

	test('Tabs: the panel is the next Tab stop after the selected tab', async ({ page }) => {
		await page.getByRole('tab', { name: 'STATUS' }).focus();
		await page.keyboard.press('Tab');
		await expect(page.getByRole('tabpanel')).toBeFocused();
	});

	test('Dropdown opens from the keyboard, skips disabled items and restores focus', async ({
		page
	}) => {
		const trigger = page.getByRole('button', { name: 'ACTIONS' });
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect(page.getByRole('menu')).toHaveCount(0);

		await trigger.focus();
		await page.keyboard.press('ArrowDown');
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect(page.getByRole('menuitem', { name: 'REBOOT' })).toBeFocused();

		await page.keyboard.press('ArrowDown');
		await expect(page.getByRole('menuitem', { name: 'SHUTDOWN' })).toBeFocused();

		await page.keyboard.press('Escape');
		await expect(page.getByRole('menu')).toHaveCount(0);
		await expect(trigger).toBeFocused();

		await page.keyboard.press('Enter');
		await page.keyboard.press('End');
		await page.keyboard.press('Enter');
		await expect(page.getByTestId('overlay-state')).toContainText('|SHUTDOWN|');
		await expect(page.getByRole('menu')).toHaveCount(0);
		await expect(trigger).toBeFocused();
	});

	test('Dropdown closes on an outside click', async ({ page }) => {
		await page.getByRole('button', { name: 'ACTIONS' }).click();
		await expect(page.getByRole('menu')).toBeVisible();

		await page.getByTestId('boot-state').click();
		await expect(page.getByRole('menu')).toHaveCount(0);
	});

	test('Toaster announces messages, expires timed ones and keeps errors until dismissed', async ({
		page
	}) => {
		await page.getByRole('button', { name: 'SAVE' }).click();
		await page.getByRole('button', { name: 'FAIL' }).click();

		await expect(page.getByRole('status').getByText('SAVED')).toBeVisible();
		await expect(page.getByRole('alert').getByText('LINK LOST')).toBeVisible();

		await expect(page.getByText('SAVED')).toBeHidden();
		await expect(page.getByText('LINK LOST')).toBeVisible();

		await page.getByRole('button', { name: 'Dismiss notification' }).click();
		await expect(page.getByText('LINK LOST')).toBeHidden();
	});

	test('Toaster holds a message while the pointer rests on it', async ({ page }) => {
		await page.getByRole('button', { name: 'SAVE' }).click();
		const saved = page.getByText('SAVED');

		await saved.hover();
		await page.waitForTimeout(1200);
		await expect(saved).toBeVisible();

		await page.mouse.move(2, 2);
		await expect(saved).toBeHidden();
	});

	test('keep working with no hydration noise', async ({ page }) => {
		const noise = listen(page);

		await page.getByRole('button', { name: 'OPEN DIALOG' }).click();
		await page.keyboard.press('Escape');
		await page.getByRole('tab', { name: 'LOG' }).click();
		await page.getByRole('button', { name: 'ACTIONS' }).click();
		await page.keyboard.press('Escape');
		await page.getByRole('button', { name: 'SAVE' }).click();

		expect([...noise.warnings, ...noise.errors]).toEqual([]);
	});
});

test.describe('accessibility (axe, real browser)', () => {
	const audit = async (page: Page) => {
		const { violations } = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();
		return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
	};

	test('with the dialog open, colour contrast included', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('boot-state')).toHaveText('DONE');
		await page.getByRole('button', { name: 'OPEN DIALOG' }).click();
		await expect(page.getByRole('dialog')).toBeVisible();

		expect(await audit(page)).toEqual([]);
	});

	test('with the menu open and toasts showing, colour contrast included', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('boot-state')).toHaveText('DONE');
		await page.getByRole('button', { name: 'FAIL' }).click();
		await page.getByRole('button', { name: 'ACTIONS' }).click();
		await expect(page.getByRole('menu')).toBeVisible();

		expect(await audit(page)).toEqual([]);
	});

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
