const reportController = require('../controllers/reportController');
const reportModel = require('../models/reportmodel');

// Mock reportModel เพื่อป้องกันการเขียนทับไฟล์ report.json จริงขณะรันเทสต์
jest.mock('../models/reportmodel');

// Helper สร้าง Mock Response ของ Express
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-09: ผู้ใช้ส่งรายงานโพสต์สำเร็จด้วย postId ที่ส่งมาเป็น String ระบบต้องแปลงเป็น Number และตั้งค่าสถานะเริ่มต้นเป็น pending', async () => {
    // จำลอง Request ที่ส่ง postId มาเป็น String ("13") ตามพฤติกรรมการส่งข้อมูลจาก Frontend Form
    const req = {
        body: {
            postId: '13',
            reporterUsername: 'Jeng',
            reason: 'เป็นโพสต์ scammer แจกไอโฟนปลอม'
        }
    };
    const res = mockResponse();

    // จำลองการทำงานของ Model ให้คืนค่า Object รายงานที่บันทึกสำเร็จ
    reportModel.createReport.mockImplementation(async (data) => ({
        reportId: 151515,
        ...data,
        status: 'pending'
    }));

    await reportController.createReport(req, res);

    // ตรวจสอบว่าระบบทำการ Type Coercion แปลง postId จาก String เป็น Number ก่อนส่งเข้า Model
    expect(reportModel.createReport).toHaveBeenCalledWith(expect.objectContaining({
        postId: 13,
        reporterUsername: 'Jeng',
        reason: 'เป็นโพสต์ scammer แจกไอโฟนปลอม'
    }));

    // ตรวจสอบสถานะการตอบกลับของ HTTP Response
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        report: expect.objectContaining({
            status: 'pending'
        })
    }));
});