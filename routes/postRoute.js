const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// Middleware ช่วยดัก Error จาก Multer (เช่น ไฟล์ใหญ่เกิน 10MB หรือนามสกุลไฟล์ไม่ถูกต้อง)
const uploadFiles = (req, res, next) => {
    const upload = postController.upload.array('file', 10);
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์"
            });
        }
        next();
    });
};

// ดึงโพสต์ทั้งหมด (พร้อมค้นหา/กรองวิชา) และดึงโพสต์เดียวตาม ID
router.get('/', postController.getPost);
router.get('/:id', postController.getPostById);

// สร้างโพสต์ใหม่ และแก้ไขโพสต์
router.post('/upload', uploadFiles, postController.createPost);
router.put('/:id/edits', uploadFiles, postController.editPost);

// ลบโพสต์ (สำหรับเจ้าของโพสต์)
router.delete('/:id', postController.deleteUserPost);

// เพิ่มและลบความคิดเห็น
router.post('/:id/comments', postController.addComment);
router.delete('/:id/comments/:commentId', postController.deleteComment);

module.exports = router;