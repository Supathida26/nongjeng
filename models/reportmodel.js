const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const reportPath = path.join(dataDir, 'report.json');

async function readReportsFromFile() {
    try {
        const fileData = await fs.readFile(reportPath, 'utf8');
        const reports = JSON.parse(fileData);
        return Array.isArray(reports) ? reports : [];
    } catch (error) {
        return [];
    }
}

async function writeReportsToFile(reports) {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(reports, null, 2), 'utf8');
}

// สร้าง Report รองรับทั้ง 3 ประเภทในหน้า admin.html: 'note', 'user', 'comment'
async function createReport(reportData) {
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
    return newReport;
}

async function getAllReports() {
    return await readReportsFromFile();
}

// อัปเดตสถานะ Report เป็น resolved
async function resolveReport(reportId) {
    const reports = await readReportsFromFile();
    const index = reports.findIndex(r => r.reportId === Number(reportId));
    
    if (index === -1) return null;
    
    reports[index].status = "resolved";
    reports[index].updatedAt = new Date().toISOString();

    await writeReportsToFile(reports);
    return reports[index];
}

// ลบรายการ Report ออกจากหน้า Admin
async function deleteReport(reportId) {
    const reports = await readReportsFromFile();
    const index = reports.findIndex(r => r.reportId === Number(reportId));

    if (index === -1) return false;

    reports.splice(index, 1);
    await writeReportsToFile(reports);
    return true;
}

module.exports = {
    createReport,
    getAllReports,
    resolveReport,
    deleteReport
};