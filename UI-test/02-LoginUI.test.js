const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
    path.join(__dirname, '..', 'public/html/login.html'),
    'utf8'
);

test('UI-02: ตรวจสอบองค์ประกอบแต่ละส่วนในหน้า Login', () => {
    expect(html).toMatch(/class="form"/i);
    expect(html).toMatch(/name="username"/i);
    expect(html).toMatch(/name="password"/i);
    expect(html).toMatch(/type="password"/i);
    expect(html).toMatch(/btn-login/i);
    expect(html).toMatch(/btn-google/i);
});
