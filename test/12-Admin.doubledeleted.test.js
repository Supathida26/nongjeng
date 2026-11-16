const adminController = require('../controllers/adminController');
const adminModel = require('../models/adminmodel');

jest.mock('../models/adminmodel');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-12: Admin กดลบโพสต์ที่ถูกลบไปแล้วซ้ำอีกครั้ง ต้องได้ 404', async () => {
    const req = { params: { id: '13' } };
    const res = mockResponse();

    adminModel.deletePost.mockResolvedValue(false);

    await adminController.deletePosts(req, res);

    expect(adminModel.deletePost).toHaveBeenCalledWith(13);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ไม่พบโพสต์ที่ต้องการลบ'
    });
});