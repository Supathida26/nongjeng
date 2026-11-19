const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
    path.join(__dirname, '..', 'public/html/admin.html'),
    'utf8'
);

test('UI-08: ตรวจสอบองค์ประกอบแต่ละส่วนในหน้า Admin', () => {
    expect(html).toMatch(/ห้อง admin/);
    expect(html).toMatch(/<table>/i);
    expect(html).toMatch(/Username/);
    expect(html).toMatch(/Gmail/);
    expect(html).toMatch(/ประเภทผู้ใช้/);
    expect(html).toMatch(/รายงานโน้ต/);
    expect(html).toMatch(/รายงานผู้ใช้/);
    expect(html).toMatch(/รายงาน Comment/);
});
