const { test, expect } = require('@playwright/test');
const pages = [
    '/html/login.html',
    '/html/home.html',
    '/html/share.html',
    '/html/edit.html',
    '/html/comment.html',
    '/html/admin.html'
];
const mobileSizes = [
    { width: 320, height: 640 },
    { width: 375, height: 812 },
    { width: 390, height: 844 }
];
test('UI-09: ตรวจสอบ UI ในหน้าจอมือถือ', async ({ page }) => {
    for (const size of mobileSizes) {
        await page.setViewportSize(size);
        for (const url of pages) {
            await page.goto(`http://localhost:3000${url}`);
            const viewport = await page.locator(
                'meta[name="viewport"]'
            ).count();
            expect(viewport).toBeGreaterThan(0);
            const overflow = await page.evaluate(() => {
                return {
                    screenWidth: window.innerWidth,
                    pageWidth: document.documentElement.scrollWidth,
                    bodyWidth: document.body.scrollWidth
                };
            });
            expect(overflow.pageWidth).toBeLessThanOrEqual(
                overflow.screenWidth
            );
            expect(overflow.bodyWidth).toBeLessThanOrEqual(
                overflow.screenWidth
            );
            // ตรวจสอบว่าหน้าเว็บไม่มีการเลื่อนแนวนอน
            await expect(page.locator('body')).toBeVisible();
            console.log(
                `Testing ${url} at ${size.width}px: PASS`
            );
        }
    }
});
