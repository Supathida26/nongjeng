const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
    path.join(__dirname, '..', 'public/html/share.html'),
    'utf8'
);

test('UI-04: ตรวจสอบชนิดไฟล์ที่รองรับ', () => {
    const match = html.match(/accept="([^"]+)"/i);

    expect(match).not.toBeNull();

    const acceptedFiles = match[1].toLowerCase();

    expect(acceptedFiles).toContain('.pdf');
    expect(acceptedFiles).toContain('.jpg');
    expect(acceptedFiles).toContain('.png');
    expect(acceptedFiles).toContain('.doc');
});
