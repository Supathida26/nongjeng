const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const { checkAdmin } = require('../middleware');

// ตรวจสอบสิทธิ์ Admin ทั้ง Router
router.use(checkAdmin);

// จัดการผู้ใช้ (ตารางข้อมูลผู้ใช้ในหน้า admin.html)
router.get('/users', adminController.getUsers);
router.patch('/users/ban', adminController.banUsers);
router.delete('/users/:username', adminController.deleteUsers);

// จัดการโพสต์และคอมเมนต์
router.get('/posts', adminController.getPosts);
router.delete('/:id/deletepost', adminController.deletePosts);
router.delete('/posts/:postId/comments/:commentId', adminController.deleteComments);

// จัดการรายงาน (กล่องรายงานโน้ต, รายงานผู้ใช้, รายงาน Comment)
router.get('/reports', reportController.getReports);
router.patch('/:id/resolve', reportController.updateReportStatus);
router.delete('/reports/:id', reportController.deleteReport);

module.exports = router;