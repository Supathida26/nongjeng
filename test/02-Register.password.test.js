const loginController = require('../controllers/loginController');
const loginModel = require('../models/loginmodel');

jest.mock('../models/loginmodel');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-02: สมัครสมาชิกด้วยรหัสผ่าน 7 ตัวอักษร (น้อยกว่าเกณฑ์ขั้นต่ำ 8 ตัว) ต้องถูกบล็อกด้วย 400', async () => {
    const req = {
        body: {
            username: 'shortpass_user',
            email: 'short@gmail.com',
            password: '1234567'
        }
    };
    const res = mockResponse();

    await loginController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'
    });
    expect(loginModel.createUser).not.toHaveBeenCalled();
});