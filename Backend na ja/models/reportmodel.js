const fs = require('fs/promises');
const path = require('path');

const reportPath = path.join(__dirname, '../data/report.json');

// ตัวแปรเก็บข้อมูล Report
let inMemoryReports = [];

async function loadInitialReports() {
    try {
        const fileData = await fs.readFile(reportPath, 'utf8');
        inMemoryReports = JSON.parse(fileData);
    } catch (error) {
        inMemoryReports = [];
    }
}

loadInitialReports();

// ผู้ใช้ทั่วไปกด Report โพสต์
async function createReport(reportData) {
    const newReport = {
        reportId: Date.now(),
        postId: reportData.postId,
        reporterUsername: reportData.reporterUsername,
        reason: reportData.reason, // เหตุผล เช่น "เนื้อหาไม่เกี่ยวข้อง", "สแปม"
        status: "pending", // pending, resolved
        createdAt: new Date().toISOString()
    };
    
    inMemoryReports.push(newReport);
    return newReport;
}


async function getAllReports() {
    return inMemoryReports;
}

// Admin จัดการ Report (เช่น ปิดเคสหลังลบโพสต์แล้ว)
async function resolveReport(reportId) {
    const index = inMemoryReports.findIndex(r => r.reportId === Number(reportId));
    if (index === -1) return null;
    
    inMemoryReports[index].status = "resolved";
    return inMemoryReports[index];
}

module.exports = {
    createReport,
    getAllReports,
    resolveReport
};