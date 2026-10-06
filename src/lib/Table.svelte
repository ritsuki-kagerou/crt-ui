<script module lang="ts">
	export type TableColumn = {
		/** the property to read from each row */
		key: string;
		label: string;
		/** `end` right-aligns numbers; default `start` */
		align?: 'start' | 'end';
	};
</script>

<script lang="ts" generics="Row extends Record<string, unknown>">
	import type { Snippet } from 'svelte';

	/**
	 * A data table on a native `<table>`: a real `<caption>`, column headers
	 * with `scope="col"`, and an optional row header column. A table wider
	 * than its box scrolls inside a focusable region, so keyboard users can
	 * reach the overflow. Cells print `row[column.key]`; pass `cell` to
	 * render something else.
	 */
	type Props = {
		columns: TableColumn[];
		rows: Row[];
		/** visible title; also the accessible name of the scroll region */
		caption?: string;
		/** accessible name when there is no visible `caption` */
		label?: string;
		/** the column whose cells are row headers (`<th scope="row">`) */
		rowHeader?: string;
		/** shown in place of the rows when there are none */
		empty?: string;
		/** custom cell content */
		cell?: Snippet<[Row, TableColumn]>;
		class?: string;
	};

	let {
		columns,
		rows,
		caption,
		label,
		rowHeader,
		empty = 'NO DATA',
		cell,
		class: klass = ''
	}: Props = $props();

	let name = $derived(label ?? caption);
</script>

<!-- the scroll region is a tab stop only so overflow can be reached by keyboard -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class={['table', klass]}
	role={name ? 'region' : undefined}
	aria-label={name}
	tabindex={name ? 0 : undefined}
>
	<table class="table__grid">
		{#if caption}<caption class="table__caption">{caption}</caption>{/if}
		<thead>
			<tr>
				{#each columns as column (column.key)}
					<th scope="col" class={{ 'is-end': column.align === 'end' }}>{column.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row, i (i)}
				<tr>
					{#each columns as column (column.key)}
						{#if column.key === rowHeader}
							<th scope="row" class={{ 'is-end': column.align === 'end' }}>
								{#if cell}{@render cell(row, column)}{:else}{row[column.key]}{/if}
							</th>
						{:else}
							<td class={{ 'is-end': column.align === 'end' }}>
								{#if cell}{@render cell(row, column)}{:else}{row[column.key]}{/if}
							</td>
						{/if}
					{/each}
				</tr>
			{:else}
				<tr>
					<td class="table__empty" colspan={columns.length}>{empty}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table {
		overflow-x: auto;
		max-width: 100%;
		font-family: var(--crt-mono, ui-monospace, monospace);
		font-size: var(--crt-text-md, 0.9rem);
	}

	.table:focus-visible {
		outline: 1px solid var(--crt-phos-hot, #d5ffe6);
		outline-offset: 3px;
	}

	.table__grid {
		width: 100%;
		border-collapse: collapse;
		color: var(--crt-phos, #4ade80);
		letter-spacing: 0.06em;
		line-height: var(--crt-leading, 1.45);
	}

	.table__caption {
		padding-bottom: var(--crt-space-2, 0.5rem);
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
		font-size: 0.85em;
		letter-spacing: var(--crt-tracking, 0.12em);
		text-align: start;
		text-transform: uppercase;
	}

	th,
	td {
		padding: var(--crt-space-2, 0.5rem) var(--crt-space-3, 0.9rem);
		border-bottom: 1px solid var(--crt-rule, rgba(74, 222, 128, 0.26));
		text-align: start;
		vertical-align: baseline;
	}

	thead th {
		border-bottom-color: var(--crt-phos, #4ade80);
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
		font-size: 0.85em;
		font-weight: normal;
		letter-spacing: var(--crt-tracking, 0.12em);
		text-transform: uppercase;
		white-space: nowrap;
	}

	tbody th {
		color: var(--crt-phos-hot, #d5ffe6);
		font-weight: normal;
	}

	tbody tr:hover {
		background: var(--crt-phos-faint, rgba(74, 222, 128, 0.16));
	}

	.is-end {
		text-align: end;
		font-variant-numeric: tabular-nums;
	}

	.table__empty {
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
		text-align: center;
	}
</style>
