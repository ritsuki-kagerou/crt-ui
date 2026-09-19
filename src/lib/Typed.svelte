<script lang="ts">
      type Props = {
              text: string;
              /** ms per karakter */
              speed?: number;
              oncomplete?: () => void;
      };

      let { text, speed = 12, oncomplete }: Props = $props();

      let shown = $state<number | null>(null);

      let visible = $derived(shown === null ? text : text.slice(0, shown));
      let typing = $derived(shown !== null && shown < text.length);

      $effect(() => {
              const full = text;
              const per = speed;

              if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                      shown = full.length;
                      oncomplete?.();
                      return;
              }

              let drawn = 0;
              let start: number | null = null;
              let frame = 0;

              shown = 0;

              const tick = (now: number) => {
                      start ??= now;
                      const next = Math.min(full.length, Math.floor((now - start) / per));
                      if (next !== drawn) {
                              drawn = next;
                              shown = next;
                      }
                      if (drawn >= full.length) {
                              oncomplete?.();
                              return;
                      }
                      frame = requestAnimationFrame(tick);
              };

              frame = requestAnimationFrame(tick);
              return () => cancelAnimationFrame(frame);
      });
</script>

<span>{visible}{#if typing}<span class="caret"></span>{/if}</span>

<style>
      .caret {
              display: inline-block;
              width: var(--crt-caret-width, 0.58em);
              height: var(--crt-caret-height, 1.02em);
              translate: 0 0.16em;
              background: currentColor;
      }
</style>