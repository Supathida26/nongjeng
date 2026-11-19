const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
    path.join(__dirname, '..', 'public/html/comment.html'),
    'utf8'
);

test('UI-07: ตรวจสอบในส่วนช่องแสดงความคิดเห็น', () => {
    expect(html).toMatch(/class="comments"/i);
    expect(html).toMatch(/class="composer"/i);
    expect(html).toMatch(/name="comment"/i);
    expect(html).toMatch(/แสดงความคิดเห็น/);
});
