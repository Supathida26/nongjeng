# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: UI-test\09-InMobileUI.test.js >> UI-09: ตรวจสอบ UI ในหน้าจอมือถือ
- Location: UI-test\09-InMobileUI.test.js:15:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/html/login.html
Call log:
  - navigating to "http://localhost:3000/html/login.html", waiting until "load"

```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const pages = [
  3  |     '/html/login.html',
  4  |     '/html/home.html',
  5  |     '/html/share.html',
  6  |     '/html/edit.html',
  7  |     '/html/comment.html',
  8  |     '/html/admin.html'
  9  | ];
  10 | const mobileSizes = [
  11 |     { width: 320, height: 640 },
  12 |     { width: 375, height: 812 },
  13 |     { width: 390, height: 844 }
  14 | ];
  15 | test('UI-09: ตรวจสอบ UI ในหน้าจอมือถือ', async ({ page }) => {
  16 |     for (const size of mobileSizes) {
  17 |         await page.setViewportSize(size);
  18 |         for (const url of pages) {
> 19 |             await page.goto(`http://localhost:3000${url}`);
     |                        ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/html/login.html
  20 |             const viewport = await page.locator(
  21 |                 'meta[name="viewport"]'
  22 |             ).count();
  23 |             expect(viewport).toBeGreaterThan(0);
  24 |             const overflow = await page.evaluate(() => {
  25 |                 return {
  26 |                     screenWidth: window.innerWidth,
  27 |                     pageWidth: document.documentElement.scrollWidth,
  28 |                     bodyWidth: document.body.scrollWidth
  29 |                 };
  30 |             });
  31 |             expect(overflow.pageWidth).toBeLessThanOrEqual(
  32 |                 overflow.screenWidth
  33 |             );
  34 |             expect(overflow.bodyWidth).toBeLessThanOrEqual(
  35 |                 overflow.screenWidth
  36 |             );
  37 |             // ตรวจสอบว่าหน้าเว็บไม่มีการเลื่อนแนวนอน
  38 |             await expect(page.locator('body')).toBeVisible();
  39 |             console.log(
  40 |                 `Testing ${url} at ${size.width}px: PASS`
  41 |             );
  42 |         }
  43 |     }
  44 | });
  45 | 
```