const UsersModel = require("../models/loginmodel");
const { OAuth2Client } = require('google-auth-library'); //npm install google-auth-library

// สร้าง Client Instance
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const login = async (req, res) => {
    console.log("REQ BODY IS:", req.body);
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "กรุณาใส่ Username/Email และ Password อีกครั้ง" 
            });
        }

        //เรียกใช้ฟังก์ชันจาก Model
        let user = await UsersModel.findByIdentifierAndPassword(identifier, password);

        //ถ้าหาไม่เจอ
        if (!user) {
            //กรณีที่สามารถ login ด้วยการสร้าง account ใหม่
            /*user = {
                id: Date.now(),
                username: identifier.includes('@') ? identifier.split('@')[0] : identifier,
                email: identifier.includes('@') ? identifier : `${identifier}@gmail.com`,
                role: "user",
                isNewUser: true // Flag บอก Frontend ว่าเพิ่งสมัครใหม่
            };*/

            //กรณีใช้ hardcode เป็นชื่อผู้ใช้ทั้งหมด
            return res.status(401).json({
                success: false,
                message: "Username/Email หรือ Password ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
            })
        }

        //ถ้าหากรหัสผ่านผิด
        else if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Password ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
            });
        }

        if (user.status === 'banned') {
            return res.status(403).json({
                success: false,
                isBanned: true,
                message: "บัญชีของคุณถูกระงับการใช้งาน (Banned)"
            });
        }

        //ตัด password ออกก่อนส่งข้อมูลกลับไป Frontend
        const { password: _, ...userData } = user;

        res.status(200).json({
            success: true,
            message: user.isNewUser ? "สมัครสมาชิกและเข้าสู่ระบบสำเร็จ!" : "เข้าสู่ระบบสำเร็จ!",
            user: userData
        });

    }catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body; // รับ ID Token (Credential) จาก Google Button ฝั่ง Frontend

        if (!credential) {
            return res.status(400).json({ 
                success: false, 
                message: "ไม่พบ Google Credential Token" 
            });
        }

        // ตรวจสอบ ID Token กับ Google
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload(); // ดึงข้อมูลโปรไฟล์ผู้ใช้จาก Google

        // จำลองข้อมูล User โดยไม่ต้องบันทึกลง Database
        const googleUser = {
            id: payload.sub, // Google Unique User ID
            username: payload.email.split('@')[0],
            email: payload.email,
            fullName: payload.name,
            picture: payload.picture,
            role: "user",
            loginType: "google"
        };

        return res.status(200).json({
            success: true,
            message: "Google Login สำเร็จ!",
            user: googleUser
        });

    } catch (error) {
        console.error("GOOGLE LOGIN ERROR:", error);
        return res.status(401).json({ 
            success: false, 
            message: "ยืนยันตัวตนด้วย Google ไม่สำเร็จ Token ไม่ถูกต้องหรือหมดอายุ" 
        });
    }
};

//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 - Cilent Secret

module.exports = { 
    login,
    googleLogin
};