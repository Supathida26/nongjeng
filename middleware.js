const adminModel = require('../models/adminmodel');

// สำหรับตรวจสอบสิทธิ์ความเป็น Admin
const checkAdmin = async (req, res, next) => {
    try {
        // ใช้ req.body?.role ป้องกัน Error เวลาเป็น GET Request ที่ไม่มี body
        const userRole = req.headers['x-user-role'] || req.query?.role || req.body?.role; 

        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access Denied: เฉพาะ Admin เท่านั้นที่เข้าถึงส่วนนี้ได้"
            });
        }

        next(); // ผ่านการตรวจสอบ ให้ไปทำงานที่ Controller ต่อได้
    } catch (error) {
        console.error("CHECK ADMIN ERROR:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Middleware สำหรับตรวจสอบว่าบัญชีถูกแบน (Banned) หรือไม่
const checkBanned = async (req, res, next) => {
    try {
        // ดึง username จาก Request (รองรับทั้ง Header, Query และ Body)
        const username = req.headers['x-username'] || req.query?.username || req.body?.username;

        if (username) {
            const users = await adminModel.getAllUsers();
            const user = users.find(u => u.username === username);

            if (user && user.status === 'banned') {
                return res.status(403).json({
                    success: false,
                    isBanned: true,
                    message: "บัญชีของคุณถูกระงับการใช้งานไม่สามารถทำรายการได้"
                });
            }
        }

        next(); // สถานะปกติ ให้ทำงานต่อได้
    } catch (error) {
        console.error("CHECK BANNED ERROR:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    checkAdmin,
    checkBanned
};