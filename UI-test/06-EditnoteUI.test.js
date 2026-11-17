const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
    path.join(__dirname, '..', 'public/html/edit.html'),
    'utf8'
);

test('UI-06: ตรวจสอบองค์ประกอบแต่ละส่วนในหน้า Edit Note', () => {
    expect(html).toMatch(/แก้ไขโน้ตของคุณ/);
    expect(html).toMatch(/name="title"/i);
    expect(html).toMatch(/name="subject"/i);
    expect(html).toMatch(/name="tags"/i);
    expect(html).toMatch(/name="detail"/i);
    expect(html).toMatch(/btn-share/i);
});
