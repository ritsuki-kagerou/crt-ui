import { defineConfig, devices } from '@playwright/test';

const DEV_PORT = 5175;
const PREVIEW_PORT = 4175;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['list']] : [['list']],
	webServer: [
		{
			command: `pnpm exec vite dev --port ${DEV_PORT} --strictPort`,
			port: DEV_PORT,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000
		},
		{
			command: `pnpm exec vite build && pnpm exec vite preview --port ${PREVIEW_PORT} --strictPort`,
			port: PREVIEW_PORT,
			reuseExistingServer: !process.env.CI,
			timeout: 180_000
		}
	],
	projects: [
		{
			name: 'dev',
			use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${DEV_PORT}` }
		},
		{
			name: 'prod',
			use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PREVIEW_PORT}` }
		}
	]
});
