const fs = require('fs/promises');
const path = require ('path');

const filePath = path.join(__dirname, '../data/users.json');

async function findByIdentifierAndPassword(identifier, password) {
    //รอให้ระบบอ่านไฟล์ JSON จาก Disk
    const fileData = await fs.readFile(filePath, 'utf8');

    //แปลงข้อความ JSON เป็น Array ของ JavaScript
    const usersData = JSON.parse(fileData);

    //ค้นหา user ที่ตรงกับ email และ password
    const user = usersData.find(u => (u.username === identifier || u.email === identifier) 
        && u.password === password );

    return user;
}

module.exports = {
    findByIdentifierAndPassword
}