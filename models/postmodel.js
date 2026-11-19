const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const filePath = path.join(dataDir, 'posts.json');
let operationQueue = Promise.resolve();

async function ensureDataDir() {
    await fs.mkdir(dataDir, { recursive: true });
}

async function readPostsFromFile() {
    console.time('ReadPost');
    try {
        const fileData = await fs.readFile(filePath, 'utf8');
        const posts = JSON.parse(fileData);

        if (!Array.isArray(posts)) {
            throw new Error('ข้อมูลใน posts.json ต้องเป็น array');
        }

        return posts;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    } finally {
        console.timeEnd('ReadPost');
    }
}

function updatePosts(update) {
    const operation = operationQueue.then(async () => {
        await ensureDataDir();
        const posts = await readPostsFromFile();
        const result = await update(posts);
        await fs.writeFile(filePath, JSON.stringify(posts, null, 2), 'utf8');
        return result;
    });

    operationQueue = operation.catch(() => {});
    return operation;
}

// ลบไฟล์แนบออกจากโฟลเดอร์ uploadFiles เวลาลบโพสต์หรืออัปเดตไฟล์ใหม่
async function removeUploadedFiles(filesArray) {
    console.time('ลบ file ใน uploadFile');
    if (!Array.isArray(filesArray)) return;
    for (const file of filesArray) {
        if (file && file.path) {
            try {
                await fs.unlink(file.path);
            } catch (err) {
                // ข้ามกรณีไม่พบไฟล์ในดิสก์
            }
        }
    }
    console.timeEnd('ลบ file ใน uploadFile');
}

async function createNote(newPost) {
    console.time('สร้าง Post');
    if (!newPost.comments) newPost.comments = [];
    return updatePosts(posts => {
        posts.push(newPost);
        console.timeEnd('สร้าง Post');
        return newPost;
    });
}

async function getPosts() {
    console.time('ดึงข้อมูล Post');
    await operationQueue;
    console.timeEnd('ดึงข้อมูล Post');
    return readPostsFromFile();
}

// ดึงโพสต์เดียวตาม ID (ใช้แสดงข้อมูลในหน้า edit.html และ comment.html)
async function getPostById(postId) {
    console.time('ค้นหา Post');
    await operationQueue;
    const posts = await readPostsFromFile();
    console.timeEnd('ค้นหา Post');
    return posts.find(post => post.id === Number(postId)) || null;
}

async function updatePost(postId, updatedData) {
    console.time('แก้ไข Post');
    return updatePosts(async posts => {
        const index = posts.findIndex(post => post.id === Number(postId));

        if (index === -1) {
            return null;
        }

        // ถ้ามีการอัปโหลดไฟล์ใหม่เข้ามาแทนที่ ให้ลบไฟล์เก่าออกด้วย
        if (updatedData.file && posts[index].file) {
            await removeUploadedFiles(posts[index].file);
        }

        posts[index] = {
            ...posts[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };
        console.timeEnd('แก้ไข Post');
        return posts[index];
    });
}

// ลบโพสต์ออกจากระบบ (ใช้ได้ทั้ง Admin และเจ้าของโพสต์)
async function deletePost(postId) {
    console.time('ลบ Post');
    return updatePosts(async posts => {
        const index = posts.findIndex(post => post.id === Number(postId));

        if (index === -1) {
            return false;
        }

        // ลบไฟล์แนบของโพสต์นั้นออกจากโฟลเดอร์ uploadFiles
        await removeUploadedFiles(posts[index].file);

        posts.splice(index, 1);
        console.timeEnd('ลบ Post');
        return true;
    });
}

async function commentPost(postId, commentData) {
    console.time('Comment');
    return updatePosts(posts => {
        const index = posts.findIndex(post => post.id === Number(postId));

        if (index === -1) {
            return null;
        }

        if (!posts[index].comments) {
            posts[index].comments = [];
        }

        posts[index].comments.push(commentData);
        console.timeEnd('Comment');
        return posts[index];
    });
}

// ลบคอมเมนต์ (สำหรับเจ้าของคอมเมนต์ หรือ Admin ลบจากกล่องรายงาน Comment)
async function deleteComment(postId, commentId) {
    console.time('ลบ Comment');
    return updatePosts(posts => {
        const postIndex = posts.findIndex(post => post.id === Number(postId));
        if (postIndex === -1 || !Array.isArray(posts[postIndex].comments)) {
            return null;
        }

        const commentIndex = posts[postIndex].comments.findIndex(
            c => c.commentId === Number(commentId)
        );
        if (commentIndex === -1) {
            return null;
        }

        posts[postIndex].comments.splice(commentIndex, 1);
        console.timeEnd('ลบ Comment');
        return posts[postIndex];
    });
}

module.exports = {
    createNote,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    commentPost,
    deleteComment
};