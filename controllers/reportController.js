const reportModel = require('../models/reportmodel');

// สำหรับ User: กดส่ง Report (โน้ต, ผู้ใช้, หรือคอมเมนต์)
const createReport = async (req, res) => {
    try {
        const { type, postId, targetUsername, commentId, reporterUsername, reason } = req.body;

        if (!reason || (!postId && !targetUsername && !commentId)) {
            return res.status(400).json({
                success: false,
                message: "กรุณาระบุเป้าหมายและเหตุผลที่ต้องการรายงาน (reason)"
            });
        }

        const reportData = {
            type: type || (commentId ? "comment" : (targetUsername ? "user" : "note")),
            postId: postId ? Number(postId) : null,
            targetUsername: targetUsername || null,
            commentId: commentId ? Number(commentId) : null,
            reporterUsername: reporterUsername || "Anonymous",
            reason: reason
        };

        const newReport = await reportModel.createReport(reportData);

        return res.status(201).json({
            success: true,
            message: "ส่งรายงานสำเร็จ ทางผู้ดูแลจะทำการตรวจสอบโดยเร็วที่สุด",
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

// สำหรับ Admin: ดึงรายการ Report ทั้งหมด (รองรับการกรองตามกล่อง type และช่องค้นหา search)
const getReports = async (req, res) => {
    try {
        const { type, search } = req.query;
        let reports = await reportModel.getAllReports();

        // กรองตามกล่องในหน้า Admin: ?type=note, ?type=user, ?type=comment
        if (type) {
            reports = reports.filter(r => r.type === type);
        }

        // รองรับช่องค้นหารายงานในแต่ละกล่องของหน้า admin.html
        if (search) {
            const keyword = search.toLowerCase();
            reports = reports.filter(r =>
                r.reason?.toLowerCase().includes(keyword) ||
                r.reporterUsername?.toLowerCase().includes(keyword) ||
                r.targetUsername?.toLowerCase().includes(keyword) ||
                String(r.postId || '').includes(keyword)
            );
        }

        if (!reports || reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบรายการรายงานใดๆ",
                reports: []
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

// สำหรับ Admin: อัปเดตสถานะ Report เป็นดำเนินการแล้ว (Resolved)
const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedReport = await reportModel.resolveReport(Number(id));

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

// สำหรับ Admin: ลบรายการ Report ออกจากหน้าแดชบอร์ด
const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const isDeleted = await reportModel.deleteReport(Number(id));

        if (!isDeleted) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบรายการรายงานที่ต้องการลบ"
            });
        }

        return res.status(200).json({
            success: true,
            message: "ลบรายการรายงานเรียบร้อยแล้ว"
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
    updateReportStatus,
    deleteReport
};