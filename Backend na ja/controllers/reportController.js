const reportModel = require('../models/reportmodel');

// สำหรับ User: กดส่ง Report โพสต์ที่ไม่เหมาะสม
const createReport = async (req, res) => {
    try {
        const { postId, reporterUsername, reason } = req.body;

        // ตรวจสอบว่าใส่ข้อมูลครบถ้วนไหม
        if (!postId || !reason) {
            return res.status(400).json({
                success: false,
                message: "กรุณาระบุ postId และ เหตุผลที่ต้องการรายงาน (reason)"
            });
        }

        const reportData = {
            postId: Number(postId),
            reporterUsername: reporterUsername,
            reason: reason
        };

        const newReport = await reportModel.createReport(reportData);

        return res.status(201).json({
            success: true,
            message: "ส่งรายงานสำเร็จ ทางผู้แลจะทำการตรวจสอบโดยเร็วที่สุด",
            report: newReport
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

// สำหรับ Admin: ดึงรายการ Report ทั้งหมดมาตรวจสอบ
const getReports = async (req, res) => {
    try {
        const reports = await reportModel.getAllReports();

        if (!reports || reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบรายการรายงานใดๆ"
            });
        }

        return res.status(200).json({
            success: true,
            reports: reports
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

//สำหรับ Admin: อัปเดตสถานะ Report เป็นดำเนินการแล้ว (Resolved)
const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params; // รับ reportId จาก URL parameter

        const updatedReport = await reportModel.resolveReport(id);

        if (!updatedReport) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบรายการรายงานที่ต้องการอัปเดต"
            });
        }

        return res.status(200).json({
            success: true,
            message: "อัปเดตสถานะเป็นดำเนินการแล้วเรียบร้อย",
            report: updatedReport
        });

    } catch (error) {
        console.error("DEBUG ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

module.exports = {
    createReport,
    getReports,
    updateReportStatus
};