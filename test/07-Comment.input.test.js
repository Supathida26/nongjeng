const postController = require('../controllers/postController');
const postModel = require('../models/postmodel');

jest.mock('../models/postmodel');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-07: ส่งคอมเมนต์ที่เป็นช่องว่างล้วนต้องถูกปฏิเสธด้วย 400', async () => {
    const req = {
        params: { id: '1' },
        body: { username: 'Leslie', comment: '       ' }
    };
    const res = mockResponse();

    await postController.addComment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'กรุณากรอกข้อความความคิดเห็น'
    });
    expect(postModel.commentPost).not.toHaveBeenCalled();
});