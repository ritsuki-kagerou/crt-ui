import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { beforeAll, describe, expect, it } from 'vitest';

import { ScreenFrame } from '$lib/index.js';
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

describe('ScreenFrame with `backHref`', () => {
	function frame(onback?: () => void) {
		const target = document.createElement('div');
		document.body.appendChild(target);

		const app = mount(ScreenFrame, {
			target,
			props: {
				title: 'T',
				backHref: '?screen=menu',
				onback,
				children: createRawSnippet(() => ({ render: () => '<p></p>' }))
			}
		});
		flushSync();

		const link = target.querySelector<HTMLAnchorElement>('a.screen__back')!;
		const cleanup = () => {
			void unmount(app);
			target.remove();
		};

		return { link, cleanup };
	}

	/** Clicks the link and reports whether the component cancelled navigation. */
	const click = (link: HTMLAnchorElement, init: MouseEventInit = {}) => {
		let prevented = false;
		// runs after the component's handler; cancels jsdom's own navigation
		const settle = (event: Event) => {
			prevented = event.defaultPrevented;
			event.preventDefault();
		};
		window.addEventListener('click', settle, { once: true });
		link.dispatchEvent(
			new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init })
		);
		return { defaultPrevented: prevented };
	};

	it('runs `onback` on click instead of following the link', () => {
		let pressed = 0;
		const { link, cleanup } = frame(() => pressed++);

		expect(link.getAttribute('href')).toBe('?screen=menu');
		const event = click(link);

		expect(pressed).toBe(1);
		expect(event.defaultPrevented).toBe(true);
		cleanup();
	});

	it('leaves modified clicks to the browser', () => {
		let pressed = 0;
		const { link, cleanup } = frame(() => pressed++);

		for (const init of [
			{ metaKey: true },
			{ ctrlKey: true },
			{ shiftKey: true },
			{ altKey: true }
		]) {
			expect(click(link, init).defaultPrevented).toBe(false);
		}
		expect(pressed).toBe(0);
		cleanup();
	});

	it('is a plain link without `onback`', () => {
		const { link, cleanup } = frame();

		expect(click(link).defaultPrevented).toBe(false);
		cleanup();
	});
});
