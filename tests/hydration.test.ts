import { mount, unmount } from 'svelte';
import { beforeAll, describe, expect, it } from 'vitest';

import { CASES, normalize, readMarkup } from './cases.js';

const noop = () => {};

beforeAll(() => {
	window.matchMedia = ((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: noop,
		removeListener: noop,
		addEventListener: noop,
		removeEventListener: noop,
		dispatchEvent: () => false
	})) as unknown as typeof window.matchMedia;
});

describe('the client’s first render is the server’s markup', () => {
	for (const c of CASES) {
		it(`${c.name}`, () => {
			const target = document.createElement('div');
			document.body.appendChild(target);

			const app = mount(c.component as never, { target, props: c.props as never });
			const client = normalize(target.innerHTML);

			void unmount(app);
			target.remove();

			expect(client, `${c.name}: the browser build diverges from the server build`).toBe(
				readMarkup(c.name)
			);
		});
	}
});
