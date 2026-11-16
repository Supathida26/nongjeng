const adminModel = require('../models/adminmodel');

// ดึงข้อมูลผู้ใช้ทั้งหมด + รองรับช่อง "ค้นหา Username Gmail ผู้ใช้" ในหน้า admin.html
const getUsers = async (req, res) => {
    try {
        const { search } = req.query;
        let users = await adminModel.getAllUsers();

        if (search) {
            const keyword = search.toLowerCase();
            users = users.filter(u => 
                u.username?.toLowerCase().includes(keyword) ||
                u.email?.toLowerCase().includes(keyword)
            );
        }

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบผู้ใช้ใดๆ",
                users: []
            });
        }

        // ตัดรหัสผ่านออกก่อนส่งไปแสดงที่ตาราง Admin
        const safeUsers = users.map(({ password, ...rest }) => rest);

        return res.status(200).json({
            success: true,
            users: safeUsers
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

const getPosts = async (req, res) => {
    try {
        let posts = await adminModel.getAllPosts();

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

const deletePosts = async (req, res) => {
    try {
        const { id } = req.params;
        const isDeleted = await adminModel.deletePost(Number(id));

        if (!isDeleted) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบโพสต์ที่ต้องการลบ"
            });
        }

        return res.status(200).json({
            success: true,
            message: "ลบโพสต์สำเร็จ!"
        });
    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

// แบน หรือ ปลดแบนผู้ใช้ (คอลัมน์ Block acc ในหน้า admin.html)
const banUsers = async (req, res) => {
    try {
        const username = req.body.username || req.params.username;
        const { status } = req.body; // ถ้าระบุ 'active' หรือ 'banned' มาจะใช้ค่านั้น ถ้าไม่ระบุจะสลับสถานะให้อัตโนมัติ

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "กรุณาระบุ username ที่ต้องการแบน/ปลดแบน"
            });
        }

        const updatedUser = await adminModel.banAccount(username, status);

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบผู้ใช้ที่ต้องการดำเนินการ"
            });
        }

        const actionText = updatedUser.status === 'banned' ? 'ระงับการใช้งานบัญชี' : 'ปลดระงับการใช้งานบัญชี';

        return res.status(200).json({
            success: true,
            message: `${actionText} ${username} เรียบร้อยแล้ว`,
            user: updatedUser
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

// ลบบัญชีผู้ใช้ (คอลัมน์ Delete acc ในหน้า admin.html)
const deleteUsers = async (req, res) => {
    try {
        const username = req.params.username || req.body.username;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "กรุณาระบุ username ที่ต้องการลบ"
            });
        }

        const isDeleted = await adminModel.deleteAccount(username);

        if (!isDeleted) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบผู้ใช้ที่ต้องการลบ"
            });
        }

        return res.status(200).json({
            success: true,
            message: `ลบบัญชีผู้ใช้ ${username} เรียบร้อยแล้ว`
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

// สำหรับ Admin กดลบคอมเมนต์ที่มีปัญหาจากกล่อง "รายงาน Comment"
const deleteComments = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const updatedPost = await adminModel.deleteComment(Number(postId), Number(commentId));

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
    getUsers,
    getPosts,
    deletePosts,
    banUsers,
    deleteUsers,
    deleteComments
};