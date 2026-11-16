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
    const users = await loginModel.readUsersFromFile();
    const index = users.findIndex(u => u.username === username);

    if (index === -1) {
        return null; // หาผู้ใช้ไม่เจอ
    }

    // ถ้าไม่ได้ระบุสถานะมา ให้สลับระหว่าง banned กับ active อัตโนมัติ
    const currentStatus = users[index].status || 'active';
    const nextStatus = forceStatus ? forceStatus : (currentStatus === 'banned' ? 'active' : 'banned');

    users[index].status = nextStatus;
    users[index].updatedAt = new Date().toISOString();

    await loginModel.writeUsersToFile(users);
    return users[index];
}

// ลบบัญชีผู้ใช้ถาวร สำหรับปุ่ม Delete acc ในหน้า admin.html
async function deleteAccount(username) {
    const users = await loginModel.readUsersFromFile();
    const index = users.findIndex(u => u.username === username);

    if (index === -1) {
        return false;
    }

    users.splice(index, 1);
    await loginModel.writeUsersToFile(users);
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