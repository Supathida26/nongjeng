const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const reportPath = path.join(dataDir, 'report.json');

async function readReportsFromFile() {
    console.time('ReadReport');
    try {
        const fileData = await fs.readFile(reportPath, 'utf8');
        const reports = JSON.parse(fileData);
        return Array.isArray(reports) ? reports : [];
    } catch (error) {
        return [];
    } finally {
        console.timeEnd('ReadReport');
    }
}

async function writeReportsToFile(reports) {
    console.time('WriteReport');
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(reports, null, 2), 'utf8');
    console.timeEnd('WriteReport');
}

// สร้าง Report รองรับทั้ง 3 ประเภทในหน้า admin.html: 'note', 'user', 'comment'
async function createReport(reportData) {
    console.time('สร้าง Report');
    const reports = await readReportsFromFile();

    const newReport = {
        reportId: Date.now(),
        type: reportData.type || "note", // 'note' | 'user' | 'comment'
        postId: reportData.postId ? Number(reportData.postId) : null,
        targetUsername: reportData.targetUsername || null, // ชื่อผู้ใช้ที่ถูกรายงาน
        commentId: reportData.commentId ? Number(reportData.commentId) : null, // คอมเมนต์ที่ถูกรายงาน
        reporterUsername: reportData.reporterUsername || "Anonymous",
        reason: reportData.reason,
        status: "pending", // 'pending' | 'resolved'
        createdAt: new Date().toISOString()
    };
    
    reports.push(newReport);
    await writeReportsToFile(reports);
    console.timeEnd('สร้าง Report');
    return newReport;
}

async function getAllReports() {
    return await readReportsFromFile();
}

// อัปเดตสถานะ Report เป็น resolved
async function resolveReport(reportId) {
    console.time('เปลี่ยนสถานะ Report');
    const reports = await readReportsFromFile();
    const index = reports.findIndex(r => r.reportId === Number(reportId));
    
    if (index === -1) return null;
    
    reports[index].status = "resolved";
    reports[index].updatedAt = new Date().toISOString();

    await writeReportsToFile(reports);
    console.timeEnd('เปลี่ยนสถานะ Report');
    return reports[index];
}

// ลบรายการ Report ออกจากหน้า Admin
async function deleteReport(reportId) {
    console.time('ลบ Report');
    const reports = await readReportsFromFile();
    const index = reports.findIndex(r => r.reportId === Number(reportId));

    if (index === -1) return false;

    reports.splice(index, 1);
    await writeReportsToFile(reports);
    console.timeEnd('ลบ Report');
    return true;
}

module.exports = {
    createReport,
    getAllReports,
    resolveReport,
    deleteReport
};