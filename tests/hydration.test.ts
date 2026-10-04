import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import axe from 'axe-core';

import {
	Button,
	Dialog,
	Dropdown,
	Input,
	ScreenFrame,
	Select,
	Tabs,
	Toaster,
	toast
} from '$lib/index.js';
import { CASES, normalize, readMarkup } from './cases.js';
import TabsHarness from './fixtures/TabsHarness.svelte';

const noop = () => {};

beforeAll(() => {
	// jsdom has no modal dialogs; the browser behaviour is covered by the e2e suite
	HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
	};
	HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
		if (!this.open) return;
		this.removeAttribute('open');
		this.dispatchEvent(new Event('close'));
	};

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

const key = (el: Element, k: string, init: KeyboardEventInit = {}) => {
	el.dispatchEvent(
		new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
	);
	flushSync();
};

describe('Dialog', () => {
	it('opens and closes with `open`, and reports closing through `onclose`', () => {
		let open = false;
		let closed = 0;
		const { target, cleanup } = mountIn(Dialog, {
			title: 'CONFIRM',
			children: label('BODY'),
			onclose: () => closed++,
			get open() {
				return open;
			},
			set open(v: boolean) {
				open = v;
			}
		});
		const dialog = target.querySelector('dialog')!;

		expect(dialog.open).toBe(false);
		open = true;
		flushSync();
		// re-run the effect: the prop is a plain getter here, so flip it via the button instead
		cleanup();

		const second = mountIn(Dialog, {
			title: 'T',
			children: label('B'),
			open: true,
			onclose: () => closed++
		});
		const shown = second.target.querySelector('dialog')!;
		expect(shown.open).toBe(true);
		expect(shown.getAttribute('aria-labelledby')).toBe(second.target.querySelector('h2')!.id);

		second.target.querySelector<HTMLButtonElement>('.dialog__close')!.click();
		flushSync();
		expect(shown.open).toBe(false);
		expect(closed).toBe(1);
		second.cleanup();
	});

	it('closes on a click on the backdrop, not on its content', () => {
		const { target, cleanup } = mountIn(Dialog, { title: 'T', children: label('B'), open: true });
		const dialog = target.querySelector('dialog')!;

		target.querySelector<HTMLElement>('.dialog__content')!.click();
		expect(dialog.open).toBe(true);
		dialog.click();
		flushSync();
		expect(dialog.open).toBe(false);
		cleanup();
	});

	it('stays open on the backdrop and Escape when not dismissable', () => {
		const { target, cleanup } = mountIn(Dialog, {
			title: 'T',
			children: label('B'),
			open: true,
			dismissable: false
		});
		const dialog = target.querySelector('dialog')!;

		dialog.click();
		const cancel = new Event('cancel', { cancelable: true });
		dialog.dispatchEvent(cancel);

		expect(dialog.open).toBe(true);
		expect(cancel.defaultPrevented).toBe(true);
		cleanup();
	});

	it('closing the dialog natively sets `open` back to false', () => {
		let open = true;
		const { target, cleanup } = mountIn(Dialog, {
			title: 'T',
			children: label('B'),
			get open() {
				return open;
			},
			set open(v: boolean) {
				open = v;
			}
		});

		target.querySelector('dialog')!.close();
		flushSync();
		expect(open).toBe(false);
		cleanup();
	});
});

describe('Tabs', () => {
	const tabs = [
		{ id: 'a', label: 'A' },
		{ id: 'b', label: 'B', disabled: true },
		{ id: 'c', label: 'C' }
	];
	const tabEls = (t: HTMLElement) => [...t.querySelectorAll<HTMLElement>('[role="tab"]')];
	const selected = (t: HTMLElement) =>
		tabEls(t).find((el) => el.getAttribute('aria-selected') === 'true')!.textContent;

	it('moves with the arrow keys, skipping disabled tabs and wrapping', () => {
		const { target, cleanup } = mountIn(TabsHarness, { tabs });

		expect(selected(target)).toBe('A');
		key(tabEls(target)[0], 'ArrowRight');
		expect(selected(target)).toBe('C');
		expect(target.querySelector('[role="tabpanel"]')!.textContent).toBe('PANEL c');
		expect(document.activeElement).toBe(tabEls(target)[2]);

		key(tabEls(target)[2], 'ArrowRight');
		expect(selected(target)).toBe('A');
		key(tabEls(target)[0], 'ArrowLeft');
		expect(selected(target)).toBe('C');
		key(tabEls(target)[2], 'Home');
		expect(selected(target)).toBe('A');
		key(tabEls(target)[0], 'End');
		expect(selected(target)).toBe('C');
		cleanup();
	});

	it('keeps only the selected tab in the Tab order and wires the panel to it', () => {
		const { target, cleanup } = mountIn(TabsHarness, { id: 't', tabs, value: 'c' });
		const [a, , c] = tabEls(target);
		const tabpanel = target.querySelector('[role="tabpanel"]')!;

		expect(a.tabIndex).toBe(-1);
		expect(c.tabIndex).toBe(0);
		expect(c.getAttribute('aria-controls')).toBe(tabpanel.id);
		expect(tabpanel.getAttribute('aria-labelledby')).toBe(c.id);
		cleanup();
	});

	it('selects on click', () => {
		const { target, cleanup } = mountIn(TabsHarness, { tabs });

		tabEls(target)[2].click();
		flushSync();
		expect(target.querySelector('[role="tabpanel"]')!.textContent).toBe('PANEL c');
		cleanup();
	});
});

describe('Dropdown', () => {
	function menu(extra: Record<string, unknown> = {}) {
		const picked: string[] = [];
		const mounted = mountIn(Dropdown, {
			label: 'ACTIONS',
			items: [
				{ label: 'REBOOT', onselect: () => picked.push('reboot') },
				{ label: 'LOCKED', disabled: true },
				{ label: 'SHUTDOWN', onselect: () => picked.push('shutdown') }
			],
			...extra
		});
		const trigger = mounted.target.querySelector<HTMLButtonElement>('button')!;
		const items = () => [...mounted.target.querySelectorAll<HTMLElement>('[role="menuitem"]')];
		const enabled = () => items().filter((el) => el.getAttribute('aria-disabled') !== 'true');
		return { ...mounted, picked, trigger, items, enabled };
	}

	it('opens on click with focus on the first item, and wires the ARIA state', () => {
		const { target, trigger, items, cleanup } = menu();

		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		trigger.click();
		flushSync();

		const list = target.querySelector('[role="menu"]')!;
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(trigger.getAttribute('aria-controls')).toBe(list.id);
		expect(list.getAttribute('aria-labelledby')).toBe(trigger.id);
		expect(document.activeElement).toBe(items()[0]);
		cleanup();
	});

	it('opens on the last item with ArrowUp, and on the first with ArrowDown', () => {
		const down = menu();
		key(down.trigger, 'ArrowDown');
		expect(document.activeElement).toBe(down.items()[0]);
		down.cleanup();

		const up = menu();
		key(up.trigger, 'ArrowUp');
		expect(document.activeElement).toBe(up.items().at(-1));
		up.cleanup();
	});

	it('navigates with arrows, Home, End and typeahead, skipping disabled items', () => {
		const { trigger, enabled, cleanup } = menu();
		trigger.click();
		flushSync();

		const [reboot, shutdown] = enabled();
		key(reboot, 'ArrowDown');
		expect(document.activeElement).toBe(shutdown); // LOCKED is skipped
		key(shutdown, 'ArrowDown');
		expect(document.activeElement).toBe(reboot); // wraps
		key(reboot, 'End');
		expect(document.activeElement).toBe(shutdown);
		key(shutdown, 'Home');
		expect(document.activeElement).toBe(reboot);
		key(reboot, 's');
		expect(document.activeElement).toBe(shutdown);
		cleanup();
	});

	it('Escape closes it and returns focus to the trigger', () => {
		const { target, trigger, items, cleanup } = menu();
		trigger.click();
		flushSync();

		key(items()[0], 'Escape');
		expect(target.querySelector('[role="menu"]')).toBeNull();
		expect(document.activeElement).toBe(trigger);
		cleanup();
	});

	it('Tab and a click outside close it', () => {
		const { target, trigger, items, cleanup } = menu();

		trigger.click();
		flushSync();
		key(items()[0], 'Tab');
		expect(target.querySelector('[role="menu"]')).toBeNull();

		trigger.click();
		flushSync();
		document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
		flushSync();
		expect(target.querySelector('[role="menu"]')).toBeNull();
		cleanup();
	});

	it('selecting an item runs its handler and `onselect`, then closes', () => {
		const heard: string[] = [];
		const { target, trigger, items, picked, cleanup } = menu({
			onselect: (item: { label: string }) => heard.push(item.label)
		});
		trigger.click();
		flushSync();

		items()[0].click();
		flushSync();
		expect(picked).toEqual(['reboot']);
		expect(heard).toEqual(['REBOOT']);
		expect(target.querySelector('[role="menu"]')).toBeNull();
		cleanup();
	});

	it('a disabled item does nothing', () => {
		const { target, trigger, picked, cleanup } = menu();
		trigger.click();
		flushSync();

		const locked = target.querySelectorAll<HTMLElement>('[role="menuitem"]')[1];
		expect(locked.getAttribute('aria-disabled')).toBe('true');
		locked.click();
		expect(picked).toEqual([]);
		expect(target.querySelector('[role="menu"]')).not.toBeNull();
		cleanup();
	});

	it('renders link items as anchors', () => {
		const { target, trigger, cleanup } = menu({ items: [{ label: 'DOCS', href: '/docs' }] });
		trigger.click();
		flushSync();

		const link = target.querySelector<HTMLAnchorElement>('a[role="menuitem"]')!;
		expect(link.getAttribute('href')).toBe('/docs');
		cleanup();
	});
});

describe('Toaster', () => {
	afterEach(() => {
		toast.clear();
		vi.useRealTimers();
	});

	const shown = (t: HTMLElement) =>
		[...t.querySelectorAll('.toast__msg')].map((e) => e.textContent);

	it('shows pushed messages, errors in the assertive region', () => {
		const { target, cleanup } = mountIn(Toaster, {});

		toast.push('SAVED', { kind: 'success' });
		toast.push('FAILED', { kind: 'error' });
		flushSync();

		expect(shown(target.querySelector('[role="status"]')!.parentElement!)).toEqual([
			'SAVED',
			'FAILED'
		]);
		expect(target.querySelector('[role="status"]')!.textContent).toContain('SAVED');
		expect(target.querySelector('[role="status"]')!.textContent).not.toContain('FAILED');
		expect(target.querySelector('[role="alert"]')!.textContent).toContain('FAILED');
		cleanup();
	});

	it('dismisses on the close button and through `toast.dismiss`', () => {
		const { target, cleanup } = mountIn(Toaster, {});
		const id = toast.push('A', { duration: 0 });
		toast.push('B', { duration: 0 });
		flushSync();

		toast.dismiss(id);
		flushSync();
		expect(shown(target)).toEqual(['B']);

		target.querySelector<HTMLButtonElement>('.toast__close')!.click();
		flushSync();
		expect(shown(target)).toEqual([]);
		cleanup();
	});

	it('expires after `duration`, defaults errors to staying, and pauses while hovered', () => {
		vi.useFakeTimers();
		const { target, cleanup } = mountIn(Toaster, {});

		toast.push('TIMED', { duration: 1000 });
		toast.push('STICKY', { kind: 'error' });
		flushSync();

		const timed = target.querySelector('.toast--info')!;
		timed.dispatchEvent(new Event('pointerenter'));
		vi.advanceTimersByTime(5000);
		flushSync();
		expect(shown(target)).toContain('TIMED');

		timed.dispatchEvent(new Event('pointerleave'));
		vi.advanceTimersByTime(1000);
		flushSync();
		expect(shown(target)).toEqual(['STICKY']);
		cleanup();
	});

	it('also pauses while keyboard focus is inside the toast', () => {
		vi.useFakeTimers();
		const { target, cleanup } = mountIn(Toaster, {});
		toast.push('TIMED', { duration: 1000 });
		flushSync();

		target.querySelector('.toast')!.dispatchEvent(new Event('focusin', { bubbles: true }));
		vi.advanceTimersByTime(5000);
		flushSync();
		expect(shown(target)).toEqual(['TIMED']);
		cleanup();
	});
});

describe('accessibility (axe)', () => {
	const run = async (target: HTMLElement) =>
		(
			await axe.run(target, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })
		).violations.map((v) => `${v.id}: ${v.help}`);

	it('an open Dialog has no WCAG A/AA violations', async () => {
		const { target, cleanup } = mountIn(Dialog, {
			title: 'CONFIRM',
			open: true,
			children: label('BODY'),
			footer: label('ACTIONS')
		});
		const found = await run(target);
		cleanup();

		expect(found).toEqual([]);
	});

	it('an open Dropdown has no WCAG A/AA violations', async () => {
		const { target, cleanup } = mountIn(Dropdown, {
			label: 'ACTIONS',
			items: [
				{ label: 'REBOOT' },
				{ label: 'LOCKED', disabled: true },
				{ label: 'DOCS', href: '/docs' }
			]
		});
		target.querySelector('button')!.click();
		flushSync();
		const found = await run(target);
		cleanup();

		expect(found).toEqual([]);
	});

	it('a Toaster with messages has no WCAG A/AA violations', async () => {
		const { target, cleanup } = mountIn(Toaster, {});
		toast.push('SAVED', { kind: 'success', duration: 0 });
		toast.push('FAILED', { kind: 'error' });
		flushSync();
		const found = await run(target);
		cleanup();
		toast.clear();

		expect(found).toEqual([]);
	});

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
