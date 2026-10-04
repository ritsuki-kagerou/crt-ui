import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import {
	Boot,
	Crt,
	Dialog,
	Dropdown,
	Meter,
	ScreenFrame,
	Tabs,
	Toaster,
	Typed
} from '$lib/index.js';
import { CASES, markupPath, normalize } from './cases.js';

const noop = () => {};

const html = (c: (typeof CASES)[number]) =>
	render(c.component as never, { props: c.props as never }).body;

describe('SSR output is deterministic', () => {
	for (const c of CASES) {
		it(`${c.name} renders identically every time`, () => {
			const first = html(c);

			expect(html(c)).toBe(first);
			expect(html(c)).toBe(first);
			expect(first.length).toBeGreaterThan(0);
		});
	}
});

describe('SSR output is recorded, and the browser build must match it', () => {
	for (const c of CASES) {
		it(`${c.name}`, async () => {
			await expect(normalize(html(c))).toMatchFileSnapshot(markupPath(c.name));
		});
	}
});

describe('SSR output is the settled, animation-free state', () => {
	it('Typed renders the finished line and no caret', () => {
		const markup = render(Typed, { props: { text: 'BACKEND & API' } }).body;

		expect(markup).not.toContain('crt-caret');
	});

	it('Typed puts the line in the markup exactly once', () => {
		const markup = render(Typed, { props: { text: 'BACKEND & API' } }).body;
		const text = markup.replace(/<[^>]*>/g, '');

		expect(markup.match(/BACKEND &amp; API/g)).toHaveLength(1);
		expect(markup).not.toContain('crt-sr');
		expect(markup).not.toContain('aria-hidden');
		expect(text).toBe('BACKEND &amp; API');
	});

	it('Typed ignores `hold` on the server — the caret is client-only', () => {
		const markup = render(Typed, { props: { text: 'HOLD ME', hold: true } }).body;
		expect(markup).not.toContain('crt-caret');
	});

	it('Boot renders only the first log line, with no progress bar', () => {
		const markup = render(Boot, {
			props: { lines: ['ONE', 'TWO', 'THREE'], unit: 'UNIT', ondone: noop }
		}).body;

		expect(markup).toContain('ONE');
		expect(markup).not.toContain('TWO');
		expect(markup).not.toContain('THREE');
		expect(markup).not.toContain('boot__meter');
		expect(markup).not.toContain('PRESS ANY KEY');
	});

	it('Meter fills from props alone, with the ARIA value already correct', () => {
		const markup = render(Meter, { props: { value: 0.6, label: 'PRIMARY', cells: 24 } }).body;

		expect(markup).toContain('aria-valuenow="60"');
		expect(markup.match(/meter__cell--on/g)).toHaveLength(14);
		expect(markup.match(/class="meter__cell/g)).toHaveLength(24);
	});

	it('Meter clamps out-of-range values instead of rendering them', () => {
		expect(render(Meter, { props: { value: 4 } }).body).toContain('aria-valuenow="100"');
		expect(render(Meter, { props: { value: -2 } }).body).toContain('aria-valuenow="0"');
	});

	it('Crt renders four decorative layers, hidden from assistive tech', () => {
		const markup = render(Crt, { props: {} }).body;

		expect(markup).toContain('aria-hidden="true"');
		for (const layer of ['crt__sweep', 'crt__lines', 'crt__flicker', 'crt__vignette']) {
			expect(markup).toContain(layer);
		}
	});

	it('ScreenFrame renders its title and its snippet', () => {
		const markup = render(ScreenFrame, {
			props: {
				title: 'CAPABILITY MATRIX',
				code: 'SECTOR 02/05',
				children: createRawSnippet(() => ({ render: () => '<p>CONTENT</p>' }))
			}
		}).body;

		expect(markup).toContain('CAPABILITY MATRIX');
		expect(markup).toContain('SECTOR 02/05');
		expect(markup).toContain('<p>CONTENT</p>');
		expect(markup).not.toContain('crt-caret');
	});

	it('ScreenFrame renders the back control as a button when only `onback` is given', () => {
		const markup = render(ScreenFrame, {
			props: {
				title: 'T',
				onback: noop,
				children: createRawSnippet(() => ({ render: () => '<p></p>' }))
			}
		}).body;

		expect(markup).toMatch(/<button class="screen__back[^"]*"[^>]*>\[ESC\] BACK<\/button>/);
		expect(markup).not.toContain('<a ');
	});

	it('ScreenFrame renders the back control as a link when `backHref` is given', () => {
		for (const onback of [noop, undefined]) {
			const markup = render(ScreenFrame, {
				props: {
					title: 'T',
					backHref: '?screen=menu',
					onback,
					children: createRawSnippet(() => ({ render: () => '<p></p>' }))
				}
			}).body;

			expect(markup).toMatch(
				/<a class="screen__back[^"]*" href="\?screen=menu"[^>]*>\[ESC\] BACK<\/a>/
			);
			expect(markup).not.toContain('<button');
		}
	});

	it('ScreenFrame renders no back control without `onback` or `backHref`', () => {
		const markup = render(ScreenFrame, {
			props: { title: 'T', children: createRawSnippet(() => ({ render: () => '<p></p>' })) }
		}).body;

		expect(markup).not.toContain('screen__back');
	});
});

describe('overlay and navigation components render their quiet state', () => {
	const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

	it('Dialog is closed, labelled by its title, with the content already in the markup', () => {
		const markup = render(Dialog, {
			props: { id: 'd', title: 'CONFIRM', children: text('BODY') }
		}).body;

		expect(markup).not.toMatch(/<dialog[^>]* open/);
		expect(markup).toContain('aria-labelledby="d-title"');
		expect(markup).toContain('id="d-title"');
		expect(markup).toContain('BODY');
	});

	it('Dialog drops the close button when it is not dismissable', () => {
		const props = { title: 'T', children: text('B') };

		expect(render(Dialog, { props }).body).toContain('dialog__close');
		expect(render(Dialog, { props: { ...props, dismissable: false } }).body).not.toContain(
			'dialog__close'
		);
	});

	const tabs = [
		{ id: 'a', label: 'A', disabled: true },
		{ id: 'b', label: 'B' },
		{ id: 'c', label: 'C' }
	];
	const panel = createRawSnippet<[string]>((id) => ({ render: () => `<p>PANEL ${id()}</p>` }));

	it('Tabs selects the first enabled tab by default and renders only its panel', () => {
		const markup = render(Tabs, { props: { id: 't', tabs, children: panel } }).body;

		expect(markup).toContain('PANEL b');
		expect(markup).not.toContain('PANEL c');
		expect(markup.match(/aria-selected="true"/g)).toHaveLength(1);
		expect(markup.match(/role="tabpanel"/g)).toHaveLength(1);
		expect(markup).toContain('aria-labelledby="t-tab-b"');
		expect(markup.match(/tabindex="0"/g)).toHaveLength(2); // the selected tab and the panel
	});

	it('Tabs ignores a `value` that is missing or disabled', () => {
		for (const value of ['nope', 'a']) {
			const markup = render(Tabs, { props: { id: 't', tabs, value, children: panel } }).body;
			expect(markup).toContain('PANEL b');
		}
	});

	it('Dropdown renders only its trigger, collapsed', () => {
		const markup = render(Dropdown, {
			props: { id: 'm', label: 'GO', items: [{ label: 'X' }] }
		}).body;

		expect(markup).toContain('aria-haspopup="menu"');
		expect(markup).toContain('aria-expanded="false"');
		expect(markup).not.toContain('role="menu"');
		expect(markup).not.toContain('aria-controls');
	});

	it('Toaster renders both live regions, empty', () => {
		const markup = render(Toaster, { props: {} }).body;

		expect(markup).toContain('role="status"');
		expect(markup).toContain('role="alert"');
		expect(markup).not.toContain('toast__msg');
	});
});

describe('the render path reaches for nothing that could diverge', () => {
	const dir = fileURLToPath(new URL('../src/lib/', import.meta.url));
	const sources = readdirSync(dir)
		.filter((f) => f.endsWith('.svelte') || f.endsWith('.ts'))
		.map((f) => [f, readFileSync(dir + f, 'utf8')] as const);

	const FORBIDDEN: [RegExp, string][] = [
		[/\bMath\.random\b/, 'random values differ between the two renders'],
		[/\bDate\.now\b/, 'the clock moves between server and client'],
		[/\bnew Date\b/, 'the clock moves between server and client'],
		[/\bperformance\.now\b/, 'the clock moves between server and client'],
		[/\bcrypto\.(randomUUID|getRandomValues)\b/, 'random values differ between the two renders'],
		[/\btypeof (window|document)\b/, 'branching on the environment forks the markup']
	];

	for (const [file, source] of sources) {
		it(`${file}`, () => {
			for (const [pattern, why] of FORBIDDEN) {
				expect(source, `${file}: ${why}`).not.toMatch(pattern);
			}
		});
	}

	it('browser globals are only read inside $effect', () => {
		for (const [file, source] of sources) {
			const beforeFirstEffect = source.split('$effect')[0];
			expect(beforeFirstEffect, file).not.toMatch(/\b(window|document)\s*\./);
		}
	});
});
