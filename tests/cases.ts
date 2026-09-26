import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { Crt } from '$lib/index.js';

const noop = () => {};

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
	}
];

export function normalize(html: string): string {
	return sortAttributes(html.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ')).trim();
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
