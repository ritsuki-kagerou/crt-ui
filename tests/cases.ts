import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRawSnippet } from 'svelte';

import {
	Boot,
	Button,
	Crt,
	Dialog,
	Dropdown,
	Input,
	Meter,
	ScreenFrame,
	Select,
	Table,
	Tabs,
	Toaster,
	Typed
} from '$lib/index.js';
import Kitchen from './fixtures/Kitchen.svelte';

const noop = () => {};
const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

export type Case = {
	name: string;
	component: unknown;
	props: Record<string, unknown>;
};

export const CASES: Case[] = [
	{
		name: 'Crt',
		component: Crt,
		props: {}
	},
	{
		name: 'Crt (layers off)',
		component: Crt,
		props: { scanlines: false, sweep: false, flicker: false, vignette: false }
	},
	{
		name: 'Crt (noise, curvature)',
		component: Crt,
		props: { noise: true, curvature: true }
	},
	{
		name: 'Meter',
		component: Meter,
		props: { value: 0.6, label: 'PRIMARY' }
	},
	{
		name: 'Typed',
		component: Typed,
		props: { text: 'BACKEND & API', speed: 4 }
	},
	{
		name: 'Typed (hold)',
		component: Typed,
		props: { text: 'HOLD ME', hold: true }
	},
	{
		name: 'Boot',
		component: Boot,
		props: { lines: ['ONE', 'TWO', 'THREE'], unit: 'UNIT', ondone: noop }
	},
	{
		name: 'ScreenFrame',
		component: ScreenFrame,
		props: {
			title: 'CAPABILITY MATRIX',
			code: 'SECTOR 02/05',
			footer: 'EOF',
			onback: noop,
			children: createRawSnippet(() => ({ render: () => '<p>CONTENT</p>' }))
		}
	},
	{
		name: 'ScreenFrame (backHref)',
		component: ScreenFrame,
		props: {
			title: 'CAPABILITY MATRIX',
			backHref: '?screen=menu',
			onback: noop,
			children: createRawSnippet(() => ({ render: () => '<p>CONTENT</p>' }))
		}
	},
	{
		name: 'Button',
		component: Button,
		props: { onclick: noop, children: text('EXECUTE') }
	},
	{
		name: 'Button (solid, disabled)',
		component: Button,
		props: { variant: 'solid', disabled: true, children: text('EXECUTE') }
	},
	{
		name: 'Button (href)',
		component: Button,
		props: { href: '/docs', children: text('READ THE DOCS') }
	},
	{
		name: 'Button (href, disabled)',
		component: Button,
		props: { href: '/docs', disabled: true, children: text('READ THE DOCS') }
	},
	// `$props.id()` differs between a fresh client mount and the server, so the
	// field cases pin `id`; generated ids are covered by the e2e hydration test
	{
		name: 'Input',
		component: Input,
		props: { id: 'callsign', label: 'CALLSIGN', value: 'RK-9000', placeholder: 'ENTER' }
	},
	{
		name: 'Input (hint, error)',
		component: Input,
		props: {
			id: 'freq',
			label: 'FREQUENCY',
			hint: 'MHZ, 88–108',
			error: 'OUT OF BAND',
			prompt: '',
			type: 'number'
		}
	},
	{
		name: 'Select',
		component: Select,
		props: {
			id: 'phosphor',
			label: 'PHOSPHOR',
			options: ['GREEN', { value: 'amber', label: 'AMBER' }, { value: 'white', disabled: true }],
			value: 'amber'
		}
	},
	{
		name: 'Select (placeholder, error)',
		component: Select,
		props: {
			id: 'sector',
			label: 'SECTOR',
			options: ['01', '02'],
			placeholder: 'CHOOSE',
			hint: 'TWO SECTORS ONLINE',
			error: 'REQUIRED',
			required: true
		}
	},
	{
		name: 'Table',
		component: Table,
		props: {
			caption: 'SECTORS',
			columns: [
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'NAME' },
				{ key: 'load', label: 'LOAD %', align: 'end' }
			],
			rows: [
				{ id: '01', name: 'ALPHA', load: 42 },
				{ id: '02', name: 'BRAVO', load: 7 }
			],
			rowHeader: 'id'
		}
	},
	{
		name: 'Table (empty)',
		component: Table,
		props: {
			label: 'LOG',
			columns: [{ key: 'line', label: 'LINE' }],
			rows: [],
			empty: 'NOTHING YET'
		}
	},
	{
		name: 'Dialog (closed)',
		component: Dialog,
		props: {
			id: 'confirm',
			title: 'CONFIRM PURGE',
			children: text('THIS CANNOT BE UNDONE'),
			footer: text('ACTIONS')
		}
	},
	{
		name: 'Dialog (not dismissable)',
		component: Dialog,
		props: { id: 'lock', title: 'LOCKED', dismissable: false, children: text('WAIT') }
	},
	{
		name: 'Tabs',
		component: Tabs,
		props: {
			id: 'sections',
			label: 'SECTIONS',
			tabs: [
				{ id: 'status', label: 'STATUS' },
				{ id: 'log', label: 'LOG' },
				{ id: 'keys', label: 'KEYS', disabled: true }
			],
			value: 'log',
			children: createRawSnippet<[string]>((id) => ({ render: () => `<p>PANEL ${id()}</p>` }))
		}
	},
	{
		name: 'Dropdown',
		component: Dropdown,
		props: {
			id: 'actions',
			label: 'ACTIONS',
			items: [{ label: 'REBOOT' }, { label: 'DOCS', href: '/docs' }]
		}
	},
	{
		name: 'Toaster',
		component: Toaster,
		props: {}
	},
	{
		name: 'Kitchen',
		component: Kitchen,
		props: {}
	}
];

export function normalize(html: string): string {
	// `innerHTML` escapes `>` in text; the server leaves it bare
	const unescaped = html.replace(/&gt;/g, '>');
	return sortAttributes(unescaped.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ')).trim();
}

const START_TAG = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=/>]+(?:="[^"]*")?)*)\s*\/?>/g;
const ATTRIBUTE = /[^\s=/>]+(?:="[^"]*")?/g;

function sortAttributes(html: string): string {
	return html.replace(START_TAG, (_tag, name: string, attributes: string) => {
		const sorted = (attributes.match(ATTRIBUTE) ?? []).sort();
		return sorted.length ? `<${name} ${sorted.join(' ')}>` : `<${name}>`;
	});
}

export function markupPath(name: string): string {
	const slug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

	return `./__markup__/${slug}.html`;
}

export function readMarkup(name: string): string {
	const file = fileURLToPath(new URL(markupPath(name), import.meta.url));

	if (!existsSync(file)) {
		throw new Error(
			`No recorded markup for "${name}". Run \`pnpm test:ssr\` first — that suite ` +
				`records it from the server build.`
		);
	}

	return readFileSync(file, 'utf8').trim();
}
