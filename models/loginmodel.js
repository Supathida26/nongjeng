const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const filePath = path.join(dataDir, 'users.json');

async function readUsersFromFile() {
    try {
        const fileData = await fs.readFile(filePath, 'utf8');
        const users = JSON.parse(fileData);
        return Array.isArray(users) ? users : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeUsersToFile(users) {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8');
}

// ค้นหาผู้ใช้จาก username หรือ email
async function findByIdentifier(identifier) {
    const users = await readUsersFromFile();
    return users.find(
        u => u.username?.toLowerCase() === identifier.toLowerCase() || 
             u.email?.toLowerCase() === identifier.toLowerCase()
    ) || null;
}

// ค้นหาผู้ใช้สำหรับหน้า Login
async function findByIdentifierAndPassword(identifier, password) {
    const user = await findByIdentifier(identifier);
    return user && user.password === password ? user : null;
}

// สร้างบัญชีผู้ใช้ใหม่ (สำหรับระบบสมัครสมาชิก)
async function createUser(userData) {
    const users = await readUsersFromFile();

    const newUser = {
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role || "user", // "user" หรือ "admin"
        status: "active", // "active" หรือ "banned"
        loginType: "local",
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeUsersToFile(users);
    return newUser;
}

// บันทึกหรือดึงข้อมูลผู้ใช้ที่ล็อกอินผ่าน Google ลงใน users.json
async function findOrCreateGoogleUser(googlePayload) {
    const users = await readUsersFromFile();
    let user = users.find(u => u.email?.toLowerCase() === googlePayload.email.toLowerCase());

    if (!user) {
        user = {
            id: googlePayload.sub,
            username: googlePayload.email.split('@')[0],
            email: googlePayload.email,
            fullName: googlePayload.name,
            picture: googlePayload.picture,
            role: "user",
            status: "active",
            loginType: "google",
            createdAt: new Date().toISOString()
        };
        users.push(user);
        await writeUsersToFile(users);
    }

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