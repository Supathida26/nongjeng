const adminController = require('../controllers/adminController');
const adminModel = require('../models/adminmodel');

jest.mock('../models/adminmodel');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-10: Admin ค้นหาผู้ใช้ ผลลัพธ์ต้องถูกตัด password ออกทุกบัญชี', async () => {
    const req = { query: { search: 'LEE' } };
    const res = mockResponse();

    adminModel.getAllUsers.mockResolvedValue([
        { id: 1, username: 'Leelee', email: 'leelee@gmail.com', password: 'ilovecp252', role: 'admin' },
        { id: 6, username: 'Jeng', email: 'chanakarn180649@gmail.com', password: 'iloveswu293', role: 'user' }
    ]);

    await adminController.getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.users).toHaveLength(1);
    expect(payload.users[0].username).toBe('Leelee');
    expect(payload.users[0].password).toBeUndefined();
});