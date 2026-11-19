const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const filePath = path.join(dataDir, 'users.json');

async function readUsersFromFile() {
    console.time('ReadinfoUser');
    try {
        const fileData = await fs.readFile(filePath, 'utf8');
        const users = JSON.parse(fileData);
        return Array.isArray(users) ? users : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    } finally {
        console.timeEnd('ReadinfoUser');
    }
}

async function writeUsersToFile(users) {
    console.time('WriteinfoUser');
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8');
    console.timeEnd('WriteinfoUser');
}

// ค้นหาผู้ใช้จาก username หรือ email
async function findByIdentifier(identifier) {
    console.time('ค้นหาผู้ใช้');
    const users = await readUsersFromFile();
    const result = users.find(
        u => (u.username && u.username.toLowerCase() === identifier.toLowerCase()) ||
             (u.email && u.email.toLowerCase() === identifier.toLowerCase())
    ) || null;
    console.timeEnd('ค้นหาผู้ใช้');
    return result;
}

// ค้นหาผู้ใช้สำหรับหน้า Login
async function findByIdentifierAndPassword(identifier, password) {
    console.time('ตรวจสอบผู้ใช้ใน Login');
    const user = await findByIdentifier(identifier);
    const result = user && user.password === password ? user : null;
    console.timeEnd('ตรวจสอบผู้ใช้ใน Login');
    return result;
}

// สร้างบัญชีผู้ใช้ใหม่ (สำหรับระบบสมัครสมาชิก)
async function createUser(userData) {
    console.time('สร้าง User ใหม่');
    const users = await readUsersFromFile();

    const newUser = {
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role || "user", // "user" หรือ "admin"
        status: "normal", // "active" หรือ "banned"
        loginType: "local",
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeUsersToFile(users);
    console.timeEnd('สร้าง User ใหม่');
    return newUser;
}

// บันทึกหรือดึงข้อมูลผู้ใช้ที่ล็อกอินผ่าน Google ลงใน users.json
async function findOrCreateGoogleUser(googlePayload) {
    console.time('บันทึกข้อมูล Google Login')
    const users = await readUsersFromFile();
    let user = users.find(u => u.email && u.email.toLowerCase() === googlePayload.email.toLowerCase());

    if (!user) {
        user = {
            id: googlePayload.sub,
            username: googlePayload.email.split('@')[0],
            email: googlePayload.email,
            fullName: googlePayload.name,
            picture: googlePayload.picture,
            role: "user",
            status: "normal",
            loginType: "google",
            createdAt: new Date().toISOString()
        };
        users.push(user);
        await writeUsersToFile(users);
    }
    console.timeEnd('บันทึกข้อมูล Google Login')

    return user;
}

module.exports = {
    readUsersFromFile,
    writeUsersToFile,
    findByIdentifier,
    findByIdentifierAndPassword,
    createUser,
    findOrCreateGoogleUser
};