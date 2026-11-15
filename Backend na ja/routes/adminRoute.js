const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const { checkAdmin } = require('../middleware/authMiddleware');

//checkAdmin ทั้ง Router
router.use(checkAdmin);

router.get('/users', adminController.getUsers);
router.get('/posts', adminController.getPosts);
router.patch('/users/ban', adminController.banUsers);
router.delete('/:id/deletepost', adminController.deletePosts);

router.get('/reports', reportController.getReports);
router.patch('/:id/resolve', reportController.updateReportStatus);

module.exports = router;
