const loginController = require('../controllers/loginController');
const loginModel = require('../models/loginmodel');

jest.mock('../models/loginmodel');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-03: บัญชีที่ถูกแบน (status: banned) แม้กรอกรหัสผ่านถูกเป๊ะ ก็ต้องถูกปฏิเสธด้วย 403', async () => {
    const req = { body: { identifier: 'eiei', password: '123456789' } };
    const res = mockResponse();

    loginModel.findByIdentifierAndPassword.mockResolvedValue({
        id: 888,
        username: 'eiei',
        email: 'eiei@gmail.com',
        password: '123456789',
        role: 'user',
        status: 'banned'
    });

    await loginController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        isBanned: true
    }));
});