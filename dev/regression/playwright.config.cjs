const { defineConfig } = require('../../tests/sanity/node_modules/@playwright/test')
const { homedir } = require('node:os')
const { resolve } = require('node:path')
process.env.TERON_LOCAL_REGRESSION = '1'
module.exports = defineConfig({
  testDir: resolve(__dirname, '../../tests/sanity/tests/regression'),
  testMatch: '*.local.spec.ts',
  timeout: 300000,
  workers: 1,
  reporter: 'list',
  outputDir: '/tmp/teron-regression-browser',
  use: {
    baseURL: 'http://localhost:30180',
    viewport: { width: 1440, height: 1000 },
    timezoneId: 'America/Recife',
    launchOptions: { executablePath: resolve(homedir(), '.cache/ms-playwright/chromium-1187/chrome-linux/chrome') },
    screenshot: 'only-on-failure',
    trace: 'off'
  }
})
