import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import { Boot, Crt, Meter, ScreenFrame, Typed } from '$lib/index.js';
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

		expect(markup.match(/BACKEND &amp; API/g)).toHaveLength(2);
		expect(markup).not.toContain('crt-caret');
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
