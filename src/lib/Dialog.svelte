<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';

	/**
	 * A modal window on the native `<dialog>`: the platform traps focus, makes
	 * the page behind it inert, closes on Escape and gives focus back to
	 * whatever opened it. `open` is bindable; the title labels the dialog.
	 * Any other dialog attribute (`id`, `aria-describedby`, …) is passed through.
	 */
	type Props = Omit<HTMLDialogAttributes, 'children' | 'class' | 'open' | 'title' | 'onclose'> & {
		/** whether the dialog is showing; use `bind:open` */
		open?: boolean;
		/** visible heading; also the dialog's accessible name */
		title: string;
		/** runs after the dialog closes, however it was closed */
		onclose?: () => void;
		/** Escape, a click on the backdrop and the close button all close it; turn off to require an explicit action */
		dismissable?: boolean;
		/** actions row under the content, typically Buttons */
		footer?: Snippet;
		class?: string;
		children: Snippet;
	};

	const uid = $props.id();

	let {
		open = $bindable(false),
		title,
		onclose,
		dismissable = true,
		footer,
		id = uid,
		class: klass = '',
		children,
		...rest
	}: Props = $props();

	let dialog = $state<HTMLDialogElement>();

	// the server renders it closed; showing it is client-only
	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});

	function handleClose() {
		open = false;
		onclose?.();
	}

	function handleCancel(event: Event) {
		if (!dismissable) event.preventDefault();
	}

	// the dialog element itself is only ever the target outside its content box
	function handleClick(event: MouseEvent) {
		if (dismissable && event.target === dialog) dialog?.close();
	}
</script>

<!-- the backdrop click is a pointer shortcut; Escape and the close button are the keyboard path -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	{...rest}
	bind:this={dialog}
	class={['dialog', klass]}
	{id}
	aria-labelledby="{id}-title"
	onclose={handleClose}
	oncancel={handleCancel}
	onclick={handleClick}
>
	<div class="dialog__body">
		<header class="dialog__head">
			<h2 class="dialog__title" id="{id}-title">{title}</h2>
			{#if dismissable}
				<button class="dialog__close" type="button" onclick={() => dialog?.close()}>
					[ESC] CLOSE
				</button>
			{/if}
		</header>
		<div class="dialog__content">{@render children()}</div>
		{#if footer}<footer class="dialog__foot">{@render footer()}</footer>{/if}
	</div>
</dialog>

<style>
	.dialog {
		box-sizing: border-box;
		width: var(--crt-dialog-width, min(34rem, calc(100vw - 2rem)));
		max-height: calc(100vh - 2rem);
		margin: auto;
		padding: 0;
		border: 1px solid var(--crt-phos, #4ade80);
		border-radius: 0;
		background: var(--crt-bg, #000000);
		color: var(--crt-phos, #4ade80);
		font-family: var(--crt-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
		text-shadow: 0 0 6px var(--crt-glow, rgba(30, 224, 124, 0.5));
		box-shadow: 0 0 18px var(--crt-glow, rgba(30, 224, 124, 0.5));
	}

	.dialog::backdrop {
		background: rgba(0, 0, 0, 0.78);
	}

	.dialog__body {
		display: grid;
		gap: 1rem;
		padding: 1rem 1.25rem 1.25rem;
	}

	.dialog__head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.6rem;
		border-bottom: 1px solid var(--crt-rule, rgba(74, 222, 128, 0.26));
	}

	.dialog__title {
		margin: 0;
		color: var(--crt-phos-hot, #d5ffe6);
		font-family: var(--crt-display, ui-monospace, monospace);
		font-size: 1em;
		font-weight: 700;
		letter-spacing: var(--crt-tracking, 0.12em);
		text-transform: uppercase;
	}

	.dialog__close {
		flex: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--crt-phos-mid, rgba(74, 222, 128, 0.62));
		font: inherit;
		font-size: 0.8em;
		letter-spacing: 0.12em;
		text-shadow: inherit;
		cursor: pointer;
	}

	.dialog__close:hover {
		color: var(--crt-phos-hot, #d5ffe6);
	}

	.dialog__close:focus-visible {
		outline: 1px solid var(--crt-phos-hot, #d5ffe6);
		outline-offset: 3px;
	}

	.dialog__content {
		min-width: 0;
		overflow-y: auto;
		line-height: 1.55;
	}

	.dialog__foot {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--crt-rule, rgba(74, 222, 128, 0.26));
	}
</style>
