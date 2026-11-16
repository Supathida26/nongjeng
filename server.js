const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import Routes
const userRoutes = require('./routes/loginRoute');
const postRoutes = require('./routes/postRoute');
const adminRoutes = require('./routes/adminRoute');
const reportRoutes = require('./routes/reportRoute');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // รองรับการส่งข้อมูลจาก <form> ใน HTML

// เปิดให้เข้าถึงไฟล์ HTML/CSS/JS ใน public และไฟล์ที่อัปโหลดใน uploadFiles
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploadFiles', express.static(path.join(__dirname, 'uploadFiles')));

// เมื่อเข้าหน้าแรก http://localhost:3000 ให้พาไปหน้า home.html อัตโนมัติ
app.get('/', (req, res) => {
    res.redirect('/html/home.html');
});

// ใช้งาน Route
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));