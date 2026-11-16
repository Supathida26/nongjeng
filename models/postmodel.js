const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const filePath = path.join(dataDir, 'posts.json');
let operationQueue = Promise.resolve();

async function ensureDataDir() {
    await fs.mkdir(dataDir, { recursive: true });
}

async function readPostsFromFile() {
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
}

async function createNote(newPost) {
    if (!newPost.comments) newPost.comments = [];
    return updatePosts(posts => {
        posts.push(newPost);
        return newPost;
    });
}

async function getPosts() {
    await operationQueue;
    return readPostsFromFile();
}

// ดึงโพสต์เดียวตาม ID (ใช้แสดงข้อมูลในหน้า edit.html และ comment.html)
async function getPostById(postId) {
    await operationQueue;
    const posts = await readPostsFromFile();
    return posts.find(post => post.id === Number(postId)) || null;
}

async function updatePost(postId, updatedData) {
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

        return posts[index];
    });
}

// ลบโพสต์ออกจากระบบ (ใช้ได้ทั้ง Admin และเจ้าของโพสต์)
async function deletePost(postId) {
    return updatePosts(async posts => {
        const index = posts.findIndex(post => post.id === Number(postId));

        if (index === -1) {
            return false;
        }

        // ลบไฟล์แนบของโพสต์นั้นออกจากโฟลเดอร์ uploadFiles
        await removeUploadedFiles(posts[index].file);

        posts.splice(index, 1);
        return true;
    });
}

async function commentPost(postId, commentData) {
    return updatePosts(posts => {
        const index = posts.findIndex(post => post.id === Number(postId));

        if (index === -1) {
            return null;
        }

        if (!posts[index].comments) {
            posts[index].comments = [];
        }

        posts[index].comments.push(commentData);
        return posts[index];
    });
}

// ลบคอมเมนต์ (สำหรับเจ้าของคอมเมนต์ หรือ Admin ลบจากกล่องรายงาน Comment)
async function deleteComment(postId, commentId) {
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