const { test, expect } = require('@playwright/test');

test('UI-05: ตรวจสอบองค์ประกอบแต่ละส่วนของ Post', async ({ page }) => {
    // จำลองข้อมูล Post ที่มีชื่อไฟล์ยาว
    await page.route('**/api/posts**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                posts: [{
                    id: 1,
                    username: 'Anonymous',
                    subject: 'ชีววิทยา',
                    postname: 'ทดสอบ UI Post',
                    description: 'ทดสอบการแสดงไฟล์แนบ',
                    file: [{
                        filename: 'test.pdf',
                        originalname:
                            'This_is_a_very_long_file_name_that_should_not_overflow_the_post_card.pdf',
                        mimetype: 'application/pdf'
                    }],
                    comments: []
                }]
            })
        });
    });
    await page.goto('http://localhost:3000/html/home.html');
    // รอให้ Post แสดงผล
    const post = page.locator('.note-card');
    await expect(post).toBeVisible();
    // ค้นหาไฟล์แนบภายใน Post
    const file = post.locator('a[href^="/uploadFiles/"]');
    await expect(file).toBeVisible();
    // ตรวจสอบขนาดและตำแหน่งของไฟล์แนบ
    const result = await post.evaluate((card) => {
        const attachment = card.querySelector(
            'a[href^="/uploadFiles/"]'
        );
        const cardRect = card.getBoundingClientRect();
        const fileRect = attachment.getBoundingClientRect();
        return {
            cardWidth: cardRect.width,
            fileWidth: fileRect.width,
            cardRight: cardRect.right,
            fileRight: fileRect.right,
            scrollWidth: card.scrollWidth,
            clientWidth: card.clientWidth
        };
    });
    // ไฟล์แนบต้องไม่ยื่นออกนอกกรอบ Post
    expect(result.fileRight).toBeLessThanOrEqual(
        result.cardRight + 1
    );
    // เนื้อหาภายใน Post ต้องไม่กว้างเกินกรอบ
    expect(result.scrollWidth).toBeLessThanOrEqual(
        result.clientWidth + 1
    );
});
