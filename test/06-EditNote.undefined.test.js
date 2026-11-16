const postController = require('../controllers/postController');
const postModel = require('../models/postmodel');

jest.mock('../models/postmodel');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-06: แก้ไขโน้ตเฉพาะชื่อเรื่อง ไม่ส่งค่า undefined ไปทับข้อมูลเดิม', async () => {
    const req = {
        params: { id: '1' },
        body: { title: 'Hacker (อัปเดตเฉพาะหัวข้อ)' },
        files: []
    };
    const res = mockResponse();

    postModel.updatePost.mockResolvedValue({
        id: 1,
        postname: 'Hacker (อัปเดตเฉพาะหัวข้อ)',
        subject: 'สังคมศึกษา'
    });

    await postController.editPost(req, res);

    expect(postModel.updatePost).toHaveBeenCalledWith(1, {
        postname: 'Hacker (อัปเดตเฉพาะหัวข้อ)'
    });
    expect(res.status).toHaveBeenCalledWith(200);
});