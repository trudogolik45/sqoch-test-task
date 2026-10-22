import { defineConfig, devices } from '@playwright/test'

/** `RECORD=1` — запись демо-видео в demo/ с замедлением, чтобы шаги было видно. */
const record = Boolean(process.env.RECORD)
const PORT = 5174

/** Окно браузера и видео одного размера — иначе Playwright ужимает запись до 800 px. */
function screen(width: number, height: number) {
  const size = { width, height }
  return { viewport: size, video: record ? { mode: 'on' as const, size } : ('off' as const) }
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: { slowMo: record ? 400 : 0 },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...screen(1280, 800) } },
    { name: 'mobile-360', use: { ...devices['Desktop Chrome'], ...screen(360, 780), isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
