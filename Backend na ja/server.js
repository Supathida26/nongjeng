const express = require('express');
const cors = require('cors');
require('dotenv').config();

//Import Routes
const userRoutes = require('./routes/loginRoute');
const postRoutes = require('./routes/postRoute');
const adminRoutes = require('./routes/adminRoute');
const reportRoutes = require('./routes/reportRoute');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: "this is working!" });
});

//ใช้งาน Route
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));