const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
    path.join(__dirname, '..', 'public/html/home.html'),
    'utf8'
);

test('UI-01: ตรวจสอบองค์ประกอบแต่ละส่วนในหน้า Home', () => {
    expect(html).toMatch(/class="sidebar"/i);
    expect(html).toMatch(/class="menu"/i);
    expect(html).toMatch(/class="search"/i);
    expect(html).toMatch(/ค้นหาโน้ต/);
    expect(html).toMatch(/btn-upload/i);
});
