const fs = require('fs/promises');
const path = require ('path');
const postPath = require('../models/postmodel');

const userPath = path.join(__dirname, '../data/users.json');

let temporaryUsers = [];

async function readNoteFromFile() {
    try {
    //รอให้ระบบอ่านไฟล์ JSON จาก Disk
    const fileData = await fs.readFile(userPath, 'utf8');
    //แปลงข้อความ JSON เป็น Array ของ JavaScript
    temporaryUsers = JSON.parse(fileData);
    
    } catch (error) {
        return temporaryUsers = []; //เมื่อไม่มีไฟล์ post.json ;w;
    }
}

readNoteFromFile();

async function getAllUsers() {
    return temporaryUsers;
}

async function getAllPosts() {
    return await postPath.getPosts();
}

async function banAccount(username) {
   const index = temporaryUsers.findIndex(u => u.username === username);

    if (index === -1) {
        return null; // หาผู้ใช้ไม่เจอ
    }

    // เปลี่ยนสถานะเป็น banned
    temporaryUsers[index].status = 'banned';
    temporaryUsers[index].updatedAt = new Date().toISOString();

    return temporaryUsers[index];
}

async function deletePost(postId) {
    const posts = await postPath.getPosts();
    const index = posts.findIndex(p => p.id === Number(postId));

    if (index === -1) {
        return false;
    }

    //ลบโพสต์ออกจาก Array ใน Memory (ตัดออก 1 รายการ)
    posts.splice(index, 1);

    return true; // ลบสำเร็จ
}

module.exports = {
    getAllUsers,
    getAllPosts,
    banAccount,
    deletePost
}