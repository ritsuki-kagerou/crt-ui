export type ToastKind = 'info' | 'success' | 'error';

export type ToastOptions = {
	kind?: ToastKind;
	/** milliseconds on screen; `0` keeps it until dismissed. Errors default to `0`, the rest to 5000 */
	duration?: number;
};

export type ToastMessage = {
	id: number;
	message: string;
	kind: ToastKind;
	duration: number;
};

let messages = $state<ToastMessage[]>([]);
let next = 0;

/**
 * The toast queue. Call it from the client — event handlers, effects,
 * callbacks — never while rendering on the server, where the queue would
 * be shared between requests. Render one `<Toaster />` to show it.
 */
export const toast = {
	/** shows a message; returns its id for `dismiss` */
	push(message: string, { kind = 'info', duration }: ToastOptions = {}): number {
		const id = ++next;
		messages.push({ id, message, kind, duration: duration ?? (kind === 'error' ? 0 : 5000) });
		return id;
	},

	dismiss(id: number) {
		messages = messages.filter((m) => m.id !== id);
	},

	clear() {
		messages = [];
	},

	/** the queue, oldest first */
	get messages(): readonly ToastMessage[] {
		return messages;
	}
};
