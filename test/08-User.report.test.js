const reportController = require('../controllers/reportController');
const reportModel = require('../models/reportmodel');

jest.mock('../models/reportmodel');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-08: ไม่ส่ง type มาแต่ส่ง commentId เป็น String ระบบต้องตั้ง type="comment" และแปลง ID เป็น Number', async () => {
    const req = {
        body: {
            postId: '1794283996814',
            commentId: '1794284248088',
            reporterUsername: 'MilkloveOS',
            reason: 'คอมเมนต์สแปมขายของ'
        }
    };
    const res = mockResponse();

    reportModel.createReport.mockImplementation(async (data) => ({
        reportId: 151517,
        status: 'pending',
        ...data
    }));

    await reportController.createReport(req, res);

    expect(reportModel.createReport).toHaveBeenCalledWith({
        type: 'comment',
        postId: 1794283996814,
        targetUsername: null,
        commentId: 1794284248088,
        reporterUsername: 'MilkloveOS',
        reason: 'คอมเมนต์สแปมขายของ'
    });
    expect(res.status).toHaveBeenCalledWith(201);
});
