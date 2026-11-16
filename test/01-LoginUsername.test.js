const loginController = require('../controllers/loginController');
const loginModel = require('../models/loginmodel');

jest.mock('../models/loginmodel');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-01: เข้าสู่ระบบด้วยฟิลด์ username จาก HTML สำเร็จ และต้องไม่หลุดฟิลด์ password กลับมาใน Response', async () => {
    const req = { body: { username: 'Jeng', password: 'iloveswu293' } };
    const res = mockResponse();

    loginModel.findByIdentifierAndPassword.mockResolvedValue({
        id: 6,
        username: 'Jeng',
        email: 'chanakarn180649@gmail.com',
        password: 'iloveswu293',
        role: 'user',
        status: 'normal'
    });

    await loginController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const responsePayload = res.json.mock.calls[0][0];
    expect(responsePayload.success).toBe(true);
    expect(responsePayload.user.username).toBe('Jeng');
    expect(responsePayload.user.password).toBeUndefined();
});