const postModel = require("../models/postmodel");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploadFiles/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowTypes = [
        'image/jpeg', 
        'image/png', 
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("ไฟล์ไม่ตรงประเภทที่ระบุไว้ (รองรับเฉพาะ JPG, PNG, PDF, DOC, DOCX)"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10
    },
});

const createPost = async (req, res) => {
    try {
        const { username, email, subject } = req.body;
        const postname = req.body.postname || req.body.title;
        const tag = req.body.tag || req.body.tags;
        const description = req.body.description || req.body.detail;

        if (!postname) {
            return res.status(400).json({
                success: false,
                message: "กรุณาระบุชื่อโน้ต"
            });
        }

        let filesArray = [];
        if (req.files && Array.isArray(req.files)) {
            filesArray = req.files;
        } else if (req.file) {
            filesArray = [req.file];
        }

        const uploadedFiles = filesArray.map(file => ({
            originalname: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path
        }));

        const newData = {
            id: Date.now(),
            username: username || "Anonymous",
            email: email || "",
            postname: postname,
            subject: subject || "",
            tag: tag || "",
            description: description || "",
            file: uploadedFiles,
            createdAt: new Date().toISOString(),
            comments: []
        };

        const result = await postModel.createNote(newData);

        return res.status(201).json({
            success: true,
            message: "สร้างโพสต์สำเร็จ",
            post: result
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

// ดึงโพสต์ทั้งหมด + รองรับการกรองวิชา (Chips) และช่องค้นหาในหน้า home.html
const getPost = async (req, res) => {
    try {
        const { subject, tag, search } = req.query;
        let posts = await postModel.getPosts() || [];

        if (subject && subject !== 'ทั้งหมด') {
            posts = posts.filter(p => p.subject?.toLowerCase() === subject.toLowerCase());
        }
        if (tag) {
            posts = posts.filter(p => p.tag?.toLowerCase() === tag.toLowerCase());
        }
        if (search) {
            const keyword = search.toLowerCase();
            posts = posts.filter(p => 
                p.postname?.toLowerCase().includes(keyword) ||
                p.subject?.toLowerCase().includes(keyword) ||
                p.username?.toLowerCase().includes(keyword) ||
                p.tag?.toLowerCase().includes(keyword)
            );
        }

        if (!posts || posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบโพสต์ใดๆ",
                posts: []
            });
        }
        
        return res.status(200).json({
            success: true,
            posts: posts
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

// ดึงโพสต์เดียวตาม ID (ใช้ตอนเปิดหน้า edit.html และ comment.html)
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await postModel.getPostById(Number(id));

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบโน้ตที่ต้องการ"
            });
        }

        return res.status(200).json({
            success: true,
            post: post
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

const editPost = async (req, res) => {
    try {
        const { id } = req.params;
        const postname = req.body.postname || req.body.title;
        const subject = req.body.subject;
        const tag = req.body.tag || req.body.tags;
        const description = req.body.description || req.body.detail;

        const updateData = {};
        if (postname !== undefined) updateData.postname = postname;
        if (subject !== undefined) updateData.subject = subject;
        if (tag !== undefined) updateData.tag = tag;
        if (description !== undefined) updateData.description = description;

        let filesArray = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            filesArray = req.files;
        } else if (req.file) {
            filesArray = [req.file];
        }

        if (filesArray.length > 0) {
            updateData.file = filesArray.map(file => ({
                originalname: file.originalname,
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype,
                path: file.path
            }));
        }

        const updatedPost = await postModel.updatePost(Number(id), updateData);

        if (!updatedPost) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบโพสต์ที่ต้องการแก้ไข"
            });
        }

        return res.status(200).json({
            success: true,
            message: "แก้ไขโพสต์สำเร็จ!",
            post: updatedPost
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

// ให้เจ้าของโพสต์ลบโน้ตของตัวเองได้
const deleteUserPost = async (req, res) => {
    try {
        const { id } = req.params;
        const isDeleted = await postModel.deletePost(Number(id));

        if (!isDeleted) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบโน้ตที่ต้องการลบ"
            });
        }

        return res.status(200).json({
            success: true,
            message: "ลบโน้ตเรียบร้อยแล้ว"
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, comment } = req.body;

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                success: false,
                message: "กรุณากรอกข้อความความคิดเห็น"
            });
        }

        const newComment = {
            commentId: Date.now(),
            username: username || "Anonymous",
            comment: comment.trim(),
            createdAt: new Date().toISOString()
        };

        const updatedPost = await postModel.commentPost(Number(id), newComment);

        if (!updatedPost) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบโพสต์ที่ต้องการคอมเมนต์"
            });
        }

        return res.status(201).json({
            success: true,
            message: "เพิ่มความคิดเห็นสำเร็จ!",
            comment: newComment,
            post: updatedPost
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

// ลบความคิดเห็น
const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const updatedPost = await postModel.deleteComment(Number(id), Number(commentId));

        if (!updatedPost) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบความคิดเห็นที่ต้องการลบ"
            });
        }

        return res.status(200).json({
            success: true,
            message: "ลบความคิดเห็นสำเร็จ!",
            post: updatedPost
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

module.exports = {
    createPost,
    getPost,
    getPostById,
    editPost,
    deleteUserPost,
    addComment,
    deleteComment,
    upload
};