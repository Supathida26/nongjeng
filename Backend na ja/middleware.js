const adminModel = require('../models/adminmodel');

// สำหรับตรวจสอบสิทธิ์ความเป็น Admin
const checkAdmin = async (req, res, next) => {
    try {
        // รับ role หรือ username มาจาก Header / Session / Query / Body (ปรับตามระบบ Auth ของคุณ)
        const userRole = req.headers['x-user-role'] || req.body.role; 

        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access Denied: เฉพาะ Admin เท่านั้นที่เข้าถึงส่วนนี้ได้"
            });
        }

        next(); // ผ่านการตรวจสอบ ให้ไปทำงานที่ Controller ต่อได้
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Middleware สำหรับตรวจสอบว่าบัญชีถูกแบน (Banned) หรือไม่
const checkBanned = async (req, res, next) => {
    try {
        // ดึง username จาก Request
        const username = req.headers['x-username'] || req.body.username;

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
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    checkAdmin,
    checkBanned
};