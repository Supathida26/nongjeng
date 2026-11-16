const postController = require('../controllers/postController');
const postModel = require('../models/postmodel');

jest.mock('../models/postmodel');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

test('TC-04: สร้างโน้ตโดยไม่ส่ง username (ใช้ค่าเริ่มต้น Anonymous) และรับไฟล์เดี่ยวจาก req.file ได้', async () => {
    const req = {
        body: {
            title: 'สรุป Operating Systems',
            subject: 'คอมพิวเตอร์',
            tags: '#OS',
            detail: 'เรื่อง Process และ Thread'
        },
        file: {
            originalname: 'os-summary.pdf',
            filename: '1700000-os.pdf',
            size: 204800,
            mimetype: 'application/pdf',
            path: 'uploadFiles/1700000-os.pdf'
        }
    };
    const res = mockResponse();

    postModel.createNote.mockImplementation(async (data) => data);

    await postController.createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const savedData = postModel.createNote.mock.calls[0][0];
    expect(savedData.username).toBe('Anonymous');
    expect(savedData.postname).toBe('สรุป Operating Systems');
    expect(savedData.file).toHaveLength(1);
});