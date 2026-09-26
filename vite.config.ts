import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'ssr',
					environment: 'node',
					include: ['tests/ssr.test.ts']
				}
			},
			{
				extends: true,
				resolve: { conditions: ['browser'] },
				test: {
					name: 'hydration',
					environment: 'jsdom',
					include: ['tests/hydration.test.ts']
				}
			}
		]
	}
});
