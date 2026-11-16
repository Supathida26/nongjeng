const UsersModel = require("../models/loginmodel");
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const login = async (req, res) => {
    try {
        const identifier = req.body.identifier || req.body.username;
        const { password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "กรุณาใส่ Username/Email และ Password อีกครั้ง" 
            });
        }

        const user = await UsersModel.findByIdentifierAndPassword(identifier, password);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Username/Email หรือ Password ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
            });
        }

        if (user.password !== password) {
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

        const { password: _, ...userData } = user;

        return res.status(200).json({
            success: true,
            message: "เข้าสู่ระบบสำเร็จ!",
            user: userData
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

// สมัครสมาชิกใหม่ (รองรับลิงก์ "สมัครสมาชิก" ในหน้า login.html)
const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "กรุณากรอก Username และ Password ให้ครบถ้วน"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร"
            });
        }

        const userEmail = email || (username.includes('@') ? username : `${username}@gmail.com`);
        const cleanUsername = username.includes('@') ? username.split('@')[0] : username;

        // เช็คว่ามีชื่อหรืออีเมลนี้ในระบบแล้วหรือยัง
        const existingUser = await UsersModel.findByIdentifier(cleanUsername) || 
                             await UsersModel.findByIdentifier(userEmail);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Username หรือ Email นี้ถูกใช้งานแล้ว"
            });
        }

        const newUser = await UsersModel.createUser({
            username: cleanUsername,
            email: userEmail,
            password: password
        });

        const { password: _, ...userData } = newUser;

        return res.status(201).json({
            success: true,
            message: "สมัครสมาชิกสำเร็จ!",
            user: userData
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ 
                success: false, 
                message: "ไม่พบ Google Credential Token" 
            });
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const googleUser = await UsersModel.findOrCreateGoogleUser(payload);

        if (googleUser.status === 'banned') {
            return res.status(403).json({
                success: false,
                isBanned: true,
                message: "บัญชีของคุณถูกระงับการใช้งาน (Banned)"
            });
        }

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

module.exports = { 
    login,
    register,
    googleLogin
};