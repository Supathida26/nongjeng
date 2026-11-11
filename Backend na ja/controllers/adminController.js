const adminModel = require('../models/adminmodel');

const getUsers = async (req, res) => {
    try {
        let users = await adminModel.getAllUsers();

        if (!users) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบผู้ใช้ใดๆ"
            });
        }

        return res.status(200).json({
            success: true,
            message: users
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
}

const getPosts = async (req, res) => {
    try {
        let posts = await adminModel.getAllPosts();

        if (!posts) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบโพสต์ใดๆ"
            });
        }

        return res.status(200).json({
            success: true,
            message: posts
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
}

const deletePosts = async (req, res) => {
    try {
        const { id } = req.params;

        const isDeleted = await adminModel.deletePost(id);

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
}

const banUsers = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "กรุณาระบุ username ที่ต้องการแบน"
            });
        }

        const updatedUser = await adminModel.banAccount(username);

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบผู้ใช้ที่ต้องการแบน"
            });
        }

        return res.status(200).json({
            success: true,
            message: `ระงับการใช้งานบัญชี ${username} เรียบร้อยแล้ว`,
            user: updatedUser
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
}

module.exports = {
    getUsers,
    getPosts,
    deletePosts,
    banUsers
}