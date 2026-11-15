const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/upload', postController.upload.array('file', 10), postController.createPost);
router.get('/', postController.getPost);
router.put('/:id/edits', postController.upload.array('file', 10), postController.editPost);
router.post('/:id/comments', postController.addComment);

module.exports = router;