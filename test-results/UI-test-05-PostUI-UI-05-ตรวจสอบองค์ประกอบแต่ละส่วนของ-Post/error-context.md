# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: UI-test\05-PostUI.test.js >> UI-05: ตรวจสอบองค์ประกอบแต่ละส่วนของ Post
- Location: UI-test\05-PostUI.test.js:3:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/html/home.html
Call log:
  - navigating to "http://localhost:3000/html/home.html", waiting until "load"

```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('UI-05: ตรวจสอบองค์ประกอบแต่ละส่วนของ Post', async ({ page }) => {
  4  |     // จำลองข้อมูล Post ที่มีชื่อไฟล์ยาว
  5  |     await page.route('**/api/posts**', async (route) => {
  6  |         await route.fulfill({
  7  |             status: 200,
  8  |             contentType: 'application/json',
  9  |             body: JSON.stringify({
  10 |                 posts: [{
  11 |                     id: 1,
  12 |                     username: 'Anonymous',
  13 |                     subject: 'ชีววิทยา',
  14 |                     postname: 'ทดสอบ UI Post',
  15 |                     description: 'ทดสอบการแสดงไฟล์แนบ',
  16 |                     file: [{
  17 |                         filename: 'test.pdf',
  18 |                         originalname:
  19 |                             'This_is_a_very_long_file_name_that_should_not_overflow_the_post_card.pdf',
  20 |                         mimetype: 'application/pdf'
  21 |                     }],
  22 |                     comments: []
  23 |                 }]
  24 |             })
  25 |         });
  26 |     });
> 27 |     await page.goto('http://localhost:3000/html/home.html');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/html/home.html
  28 |     // รอให้ Post แสดงผล
  29 |     const post = page.locator('.note-card');
  30 |     await expect(post).toBeVisible();
  31 |     // ค้นหาไฟล์แนบภายใน Post
  32 |     const file = post.locator('a[href^="/uploadFiles/"]');
  33 |     await expect(file).toBeVisible();
  34 |     // ตรวจสอบขนาดและตำแหน่งของไฟล์แนบ
  35 |     const result = await post.evaluate((card) => {
  36 |         const attachment = card.querySelector(
  37 |             'a[href^="/uploadFiles/"]'
  38 |         );
  39 |         const cardRect = card.getBoundingClientRect();
  40 |         const fileRect = attachment.getBoundingClientRect();
  41 |         return {
  42 |             cardWidth: cardRect.width,
  43 |             fileWidth: fileRect.width,
  44 |             cardRight: cardRect.right,
  45 |             fileRight: fileRect.right,
  46 |             scrollWidth: card.scrollWidth,
  47 |             clientWidth: card.clientWidth
  48 |         };
  49 |     });
  50 |     // ไฟล์แนบต้องไม่ยื่นออกนอกกรอบ Post
  51 |     expect(result.fileRight).toBeLessThanOrEqual(
  52 |         result.cardRight + 1
  53 |     );
  54 |     // เนื้อหาภายใน Post ต้องไม่กว้างเกินกรอบ
  55 |     expect(result.scrollWidth).toBeLessThanOrEqual(
  56 |         result.clientWidth + 1
  57 |     );
  58 | });
  59 | 
```