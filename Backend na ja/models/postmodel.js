const fs = require('fs/promises');
const path = require ('path');

const filePath = path.join(__dirname, '../data/posts.json');

let temporaryPosts = [];

async function readNoteFromFile() {
    try {
    //รอให้ระบบอ่านไฟล์ JSON จาก Disk
    const fileData = await fs.readFile(filePath, 'utf8');
    //แปลงข้อความ JSON เป็น Array ของ JavaScript
    temporaryPosts = JSON.parse(fileData);

    /*const post = postsData.find(s => s.username === username && s.postname === postname && s.subject === subject && s.tag === tag
        && s.description === description && s.file === file);
    return post;*/
    
    } catch (error) {
        return temporaryPosts; //เมื่อไม่มีไฟล์ post.json ;w;
    }
}

readNoteFromFile();

//สร้างโพสต์
async function createNote(newPost) {
    //const postsData = await readNoteFromFile(); //อ่านข้อมูลในไฟล์
    if (!newPost.comments) newPost.comments = []; //กรณีไม่เขียนลง JSON
    temporaryPosts.push(newPost); //ต่อข้อมูลโพสต์ใหม่

    //await fs.writeFile(filePath, JSON.stringify(postsData, null, 2), 'utf8'); //กรณีเขียนข้อมูลลงไฟล์ posts.json
    return newPost;
}

//แสดงโพสต์
async function getPosts() {
    //return await readNoteFromFile();
    return temporaryPosts;
}

//แก้ไขโพสต์
async function updatePost(postId, updatedData) { // ฟังก์ชันแก้ไขโพสต์ตาม ID
    //const postsData = await readNoteFromFile();
    
    // ค้นหาตำแหน่ง Index ของโพสต์ที่ต้องการแก้
    const index = temporaryPosts.findIndex(p => p.id === Number(postId));

    if (index === -1) {
        return null; // หาโพสต์ไม่เจอ
    }

    // อัปเดตข้อมูลเดิมด้วยข้อมูลใหม่
    temporaryPosts[index] = {
        ...temporaryPosts[index],
        ...updatedData,
        updatedAt: new Date().toISOString() // บันทึกเวลาที่มีการแก้ไข
    };

    //await fs.writeFile(filePath, JSON.stringify(postsData, null, 2), 'utf8'); // กรณีเขียนกลับลงไฟล์ posts.json

    return temporaryPosts[index];
}

async function commentPost(postId, commentData) {
    //const postsData = await readNoteFromFile();

    // ค้นหาตำแหน่งของโพสต์ที่ต้องการคอมเมนต์
    const index = temporaryPosts.findIndex(p => p.id === Number(postId));

    if (index === -1) {
        return null; // หาโพสต์ไม่เจอ
    }

    // ถ้าโพสต์นั้นยังไม่มี array comments ให้สร้าง array เปล่ารองรับไว้ก่อน
    if (!temporaryPosts[index].comments) {
        temporaryPosts[index].comments = [];
    }

    // เพิ่มคอมเมนต์ใหม่เข้าไปในโพสต์
    temporaryPosts[index].comments.push(commentData);

    //await fs.writeFile(filePath, JSON.stringify(postsData, null, 2), 'utf8'); // กรณีเขียนกลับลงไฟล์ posts.json

    return temporaryPosts[index];
}

module.exports = {
    createNote,
    getPosts,
    updatePost,
    commentPost
};