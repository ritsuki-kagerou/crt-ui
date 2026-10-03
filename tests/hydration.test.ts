import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { beforeAll, describe, expect, it } from 'vitest';

import axe from 'axe-core';

import { Button, Input, ScreenFrame, Select } from '$lib/index.js';
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

/**
 * `bind:value` sets DOM properties, which `innerHTML` does not show; the
 * server writes the same state as attributes. Inputs get their value on the
 * first pass, so copy it onto the attribute. A `<select>` only takes its
 * value once effects run, so `selected` is left out of the first-pass
 * comparison and checked after a flush in the `Select` tests below.
 */
function reflectFormState(root: HTMLElement) {
	for (const input of root.querySelectorAll('input')) {
		input.setAttribute('value', input.value);
	}
}

const withoutSelected = (html: string) => html.replace(/ selected=""/g, '');

describe('the client’s first render is the server’s markup', () => {
	for (const c of CASES) {
		it(`${c.name}`, () => {
			const target = document.createElement('div');
			document.body.appendChild(target);

			const app = mount(c.component as never, { target, props: c.props as never });
			reflectFormState(target);
			const client = normalize(target.innerHTML);

			void unmount(app);
			target.remove();

			expect(
				withoutSelected(client),
				`${c.name}: the browser build diverges from the server build`
			).toBe(withoutSelected(readMarkup(c.name)));
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

function mountIn<P extends Record<string, unknown>>(component: unknown, props: P) {
	const target = document.createElement('div');
	document.body.appendChild(target);
	const app = mount(component as never, { target, props: props as never });
	flushSync();
	const cleanup = () => {
		void unmount(app);
		target.remove();
	};
	return { target, cleanup };
}

const label = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Button', () => {
	it('is a `type="button"` that runs `onclick`', () => {
		let pressed = 0;
		const { target, cleanup } = mountIn(Button, {
			onclick: () => pressed++,
			children: label('GO')
		});
		const button = target.querySelector('button')!;

		expect(button.type).toBe('button');
		button.click();
		expect(pressed).toBe(1);
		cleanup();
	});

	it('as a disabled link, drops `href` and ignores clicks', () => {
		let pressed = 0;
		const { target, cleanup } = mountIn(Button, {
			href: '/docs',
			disabled: true,
			onclick: () => pressed++,
			children: label('GO')
		});
		const link = target.querySelector('a')!;

		expect(link.hasAttribute('href')).toBe(false);
		expect(link.getAttribute('aria-disabled')).toBe('true');
		link.click();
		expect(pressed).toBe(0);
		cleanup();
	});
});

describe('Input', () => {
	it('binds `value` both ways', () => {
		let value = 'RK';
		const { target, cleanup } = mountIn(Input, {
			label: 'CALLSIGN',
			get value() {
				return value;
			},
			set value(v: string) {
				value = v;
			}
		});
		const input = target.querySelector('input')!;

		expect(input.value).toBe('RK');
		input.value = 'RK-9000';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(value).toBe('RK-9000');
		cleanup();
	});

	it('ties the label, hint and error to the input with a generated id', () => {
		const { target, cleanup } = mountIn(Input, { label: 'A', hint: 'H', error: 'E' });
		const input = target.querySelector('input')!;

		expect(input.id).not.toBe('');
		expect(target.querySelector('label')!.htmlFor).toBe(input.id);
		expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-hint ${input.id}-error`);
		expect(input.getAttribute('aria-invalid')).toBe('true');
		cleanup();
	});

	it('gives two fields different ids', () => {
		const a = mountIn(Input, { label: 'A' });
		const b = mountIn(Input, { label: 'B' });

		expect(a.target.querySelector('input')!.id).not.toBe(b.target.querySelector('input')!.id);
		a.cleanup();
		b.cleanup();
	});
});

describe('Select', () => {
	it('selects `value` and binds changes back', () => {
		let value = 'amber';
		const { target, cleanup } = mountIn(Select, {
			label: 'PHOSPHOR',
			options: ['green', { value: 'amber', label: 'AMBER' }],
			get value() {
				return value;
			},
			set value(v: string) {
				value = v;
			}
		});
		const select = target.querySelector('select')!;

		expect(select.value).toBe('amber');
		select.value = 'green';
		select.dispatchEvent(new Event('change', { bubbles: true }));
		expect(value).toBe('green');
		cleanup();
	});

	it('shows the placeholder while `value` is empty', () => {
		const { target, cleanup } = mountIn(Select, {
			label: 'SECTOR',
			options: ['01', '02'],
			placeholder: 'CHOOSE'
		});
		const select = target.querySelector('select')!;

		expect(select.value).toBe('');
		expect(select.selectedOptions[0].textContent).toBe('CHOOSE');
		cleanup();
	});
});

describe('accessibility (axe)', () => {
	for (const c of CASES) {
		it(`${c.name} has no WCAG A/AA violations`, async () => {
			const { target, cleanup } = mountIn(c.component, c.props);
			const { violations } = await axe.run(target, {
				runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
			});
			cleanup();

			expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
		});
	}
});
