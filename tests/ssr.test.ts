import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
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
