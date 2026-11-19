const postModel = require('./postmodel');
const loginModel = require('./loginmodel');

async function getAllUsers() {
    return await loginModel.readUsersFromFile();
}

async function getAllPosts() {
    return await postModel.getPosts();
}

// รองรับทั้งการแบน และปลดแบน (Toggle Ban / Unban) สำหรับปุ่ม Block acc
async function banAccount(username, forceStatus = null) {
    console.time('BanUser');
    const users = await loginModel.readUsersFromFile();
    const index = users.findIndex(u => u.username === username);

    if (index === -1) {
        return null; // หาผู้ใช้ไม่เจอ
    }

    // ถ้าไม่ได้ระบุสถานะมา ให้สลับระหว่าง banned กับ active อัตโนมัติ
    const currentStatus = users[index].status || 'normal';
    const nextStatus = forceStatus ? forceStatus : (currentStatus === 'banned' ? 'normal' : 'banned');

    users[index].status = nextStatus;
    users[index].updatedAt = new Date().toISOString();

    await loginModel.writeUsersToFile(users);
    console.timeEnd('BanUser');
    return users[index];
}

// ลบบัญชีผู้ใช้ถาวร สำหรับปุ่ม Delete acc ในหน้า admin.html
async function deleteAccount(username) {
    console.time('DeleteUser');
    const users = await loginModel.readUsersFromFile();
    const index = users.findIndex(u => u.username === username);

    if (index === -1) {
        return false;
    }

    users.splice(index, 1);
    await loginModel.writeUsersToFile(users);
    console.timeEnd('DeleteUser');
    return true;
}

async function deletePost(postId) {
    return await postModel.deletePost(postId);
}

async function deleteComment(postId, commentId) {
    return await postModel.deleteComment(postId, commentId);
}

module.exports = {
    getAllUsers,
    getAllPosts,
    banAccount,
    deleteAccount,
    deletePost,
    deleteComment
};