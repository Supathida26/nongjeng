const postController = require('../controllers/postController');
const postModel = require('../models/postmodel');

jest.mock('../models/postmodel');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-05: ค้นหาโน้ตเมื่อบางโพสต์ใน JSON ไม่มีฟิลด์ subject หรือ tag ต้องไม่แครช 500', async () => {
    const req = { query: { search: 'เซต' } };
    const res = mockResponse();

    postModel.getPosts.mockResolvedValue([
        { id: 99, postname: undefined, subject: undefined, tag: undefined },
        { id: 1794283996814, postname: 'สรุปเรื่องเซต', subject: 'คณิตศาสตร์', username: 'Leelee' }
    ]);

    await postController.getPost(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        success: true,
        posts: [
            { id: 1794283996814, postname: 'สรุปเรื่องเซต', subject: 'คณิตศาสตร์', username: 'Leelee' }
        ]
    });
});