const adminController = require('../controllers/adminController');
const adminModel = require('../models/adminmodel');

jest.mock('../models/adminmodel');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-11: Admin กดปลดแบนผู้ใช้ แสดงข้อความปลดระงับการใช้งานที่ถูกต้อง', async () => {
    const req = {
        body: { username: 'eiei', status: 'normal' },
        params: {}
    };
    const res = mockResponse();

    adminModel.banAccount.mockResolvedValue({
        id: 888,
        username: 'eiei',
        status: 'normal'
    });

    await adminController.banUsers(req, res);

    expect(adminModel.banAccount).toHaveBeenCalledWith('eiei', 'normal');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'ปลดระงับการใช้งานบัญชี eiei เรียบร้อยแล้ว',
        user: { id: 888, username: 'eiei', status: 'normal' }
    });
});