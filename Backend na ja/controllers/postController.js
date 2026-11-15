const postModel = require("../models/postmodel");
const multer = require('multer');
const path = require('path');

//ตั้งค่า Storage สำหรับเซฟไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploadFiles/');
    },
    filename: (req, file, cb) => {
        //ตั้งชื่อไฟล์ใหม่เพื่อป้องกันชื่อซ้ำ: timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    //ไฟล์ที่อนุญาตให้ใช้
    const allowTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (allowTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("ไฟล์ไม่ตรงประเภทที่ระบุไว้"), false);
    }
};

const upload = multer({ //ตัวเอาไว้เก็บไฟล์
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,  // 10MB limit
        files: 10 //อัปโหลดได้ 10 ไฟล์
    },
});

const createPost = async (req, res) => {
    try {
        const { username, email, postname, subject, tag, description } = req.body;

        //รูปแบบของไฟล์อัพโหลดว่ามีอะไรบ้าง
        const uploadedFiles = req.files ? req.files.map(file => ({
            originalname: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path
        })) : [];

        //รูปแบบของโพสต์ว่ามีอะไรบ้าง
        const newData = {
            id: Date.now(),
            username: username,
            email: email,
            postname: postname,
            subject: subject,
            tag: tag,
            description: description,
            file: uploadedFiles, //เก็บเป็น Array ให้รองรับหลายไฟล์
            createdAt: new Date().toISOString(),
            comments: []
        }

        const result = await postModel.createNote(newData); //สร้างโน๊ต

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
}

//แสดงโพสต์ทั้งหมดที่มี
const getPost = async (req, res) => {
    try {
        const { subject, tag, search } = req.query; // ดึง query string จาก URL
        let posts = await postModel.getPosts(); //รับค่ามา

        //ใช้ filter
        if (subject) {
            posts = posts.filter(p => p.subject.toLowerCase() === subject.toLowerCase());
        }
        if (tag) {
            posts = posts.filter(p => p.tag === tag);
        }
        if (search) {
            posts = posts.filter(p => p.postname.toLowerCase().includes(search.toLowerCase()));
        }

        if (!posts) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบโพสต์ใดๆ"
            })
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
}

const editPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { postname, subject, tag, description } = req.body;

        // จัดเตรียมวัตถุข้อมูลใหม่ที่จะแก้ไข
        const updateData = {
            postname,
            subject,
            tag,
            description
        };

        // หากมีการอัปโหลดไฟล์ใหม่เข้ามาแทนที่
        if (req.files && req.files.length > 0) {
            updateData.files = req.files.map(file => ({
                originalname: file.originalname,
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype,
                path: file.path
            }));
        }

        const updatedPost = await postModel.updatePost(id, updateData);

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

const addComment = async (req, res) => {
    try {
        const { id } = req.params; // รับ postId
        const { username, comment } = req.body;

        if (!comment) {
            return res.status(400).json({
                success: false,
                message: "กรุณากรอกข้อความความคิดเห็น"
            });
        }

        const newComment = {
            commentId: Date.now(),
            username: username || "Anonymous",
            comment: comment,
            createdAt: new Date().toISOString()
        };

        const updatedPost = await postModel.commentPost(id, newComment);

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

module.exports = {
    createPost,
    getPost,
    editPost,
    addComment,
    upload
}