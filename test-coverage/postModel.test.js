const fs = require('fs/promises');
const path = require('path');
const postModel = require('../models/postmodel');

jest.mock('fs/promises');

const expectedDataDir = path.join(__dirname, '../data');
const expectedFilePath = path.join(expectedDataDir, 'posts.json');

describe('postmodel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fs.mkdir.mockResolvedValue();
        fs.writeFile.mockResolvedValue();
        fs.unlink.mockResolvedValue();
    });

    describe('getPosts & readPostsFromFile', () => {
        test('should return parsed posts array when file contains valid JSON array', async () => {
            const mockPosts = [{ id: 1, title: 'Note 1', comments: [] }];
            fs.readFile.mockResolvedValue(JSON.stringify(mockPosts));

            const result = await postModel.getPosts();

            expect(fs.readFile).toHaveBeenCalledWith(expectedFilePath, 'utf8');
            expect(result).toEqual(mockPosts);
        });

        test('should return empty array when posts.json does not exist (ENOENT)', async () => {
            const enoentError = new Error('ENOENT');
            enoentError.code = 'ENOENT';
            fs.readFile.mockRejectedValue(enoentError);

            const result = await postModel.getPosts();

            expect(result).toEqual([]);
        });

        test('should throw error when JSON content is not an array', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify({ id: 1 }));

            await expect(postModel.getPosts()).rejects.toThrow('ข้อมูลใน posts.json ต้องเป็น array');
        });

        test('should rethrow unexpected file system errors and recover operationQueue', async () => {
            const permError = new Error('Permission denied');
            permError.code = 'EACCES';
            fs.readFile.mockRejectedValueOnce(permError);

            // Rejects inside updatePosts, exercising operationQueue = operation.catch(() => {})
            await expect(postModel.createNote({ id: 1, title: 'Test' })).rejects.toThrow('Permission denied');

            // Subsequent queued operation should still execute normally
            fs.readFile.mockResolvedValueOnce(JSON.stringify([]));
            const posts = await postModel.getPosts();
            expect(posts).toEqual([]);
        });
    });

    describe('getPostById', () => {
        test('should return matching post when found (coercing string ID to Number)', async () => {
            const mockPosts = [
                { id: 1, title: 'First' },
                { id: 2, title: 'Second' }
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(mockPosts));

            const result = await postModel.getPostById('2');

            expect(result).toEqual(mockPosts[1]);
        });

        test('should return null when post ID does not exist', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([{ id: 1, title: 'First' }]));

            const result = await postModel.getPostById(999);

            expect(result).toBeNull();
        });
    });

    describe('createNote', () => {
        test('should initialize comments array when omitted and save post', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([]));

            const newPost = { id: 1, title: 'New Note' };
            const result = await postModel.createNote(newPost);

            expect(result).toEqual({ id: 1, title: 'New Note', comments: [] });
            expect(fs.mkdir).toHaveBeenCalledWith(expectedDataDir, { recursive: true });
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedFilePath,
                JSON.stringify([result], null, 2),
                'utf8'
            );
        });

        test('should preserve existing comments array when already provided', async () => {
            const existingPosts = [{ id: 1, title: 'Old', comments: [] }];
            fs.readFile.mockResolvedValue(JSON.stringify(existingPosts));

            const newPost = { id: 2, title: 'With Comments', comments: [{ commentId: 10, text: 'Hi' }] };
            const result = await postModel.createNote(newPost);

            expect(result.comments).toEqual([{ commentId: 10, text: 'Hi' }]);
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedFilePath,
                JSON.stringify([...existingPosts, newPost], null, 2),
                'utf8'
            );
        });
    });

    describe('updatePost', () => {
        test('should return null when post to update is not found', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([{ id: 1, title: 'Existing' }]));

            const result = await postModel.updatePost(999, { title: 'Updated' });

            expect(result).toBeNull();
        });

        test('should update post without removing files when no new file is uploaded', async () => {
            const existingPosts = [
                { id: 1, title: 'Old Title', file: [{ path: 'uploadFiles/old.png' }] }
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(existingPosts));

            const result = await postModel.updatePost('1', { title: 'New Title' });

            expect(fs.unlink).not.toHaveBeenCalled();
            expect(result).toMatchObject({
                id: 1,
                title: 'New Title',
                file: [{ path: 'uploadFiles/old.png' }]
            });
            expect(new Date(result.updatedAt).toISOString()).toBe(result.updatedAt);
        });

        test('should update post without calling unlink when post had no previous files', async () => {
            const existingPosts = [{ id: 1, title: 'No File Post' }];
            fs.readFile.mockResolvedValue(JSON.stringify(existingPosts));

            const newFiles = [{ path: 'uploadFiles/new.png' }];
            const result = await postModel.updatePost(1, { file: newFiles });

            expect(fs.unlink).not.toHaveBeenCalled();
            expect(result.file).toEqual(newFiles);
        });

        test('should remove old uploaded files when replacing with new files', async () => {
            const existingPosts = [
                {
                    id: 1,
                    title: 'With File',
                    file: [{ path: 'uploadFiles/old1.png' }, { path: 'uploadFiles/old2.png' }]
                }
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(existingPosts));

            const newFiles = [{ path: 'uploadFiles/new.png' }];
            const result = await postModel.updatePost(1, { title: 'Replaced', file: newFiles });

            expect(fs.unlink).toHaveBeenCalledTimes(2);
            expect(fs.unlink).toHaveBeenCalledWith('uploadFiles/old1.png');
            expect(fs.unlink).toHaveBeenCalledWith('uploadFiles/old2.png');
            expect(result.file).toEqual(newFiles);
        });
    });

    describe('deletePost & removeUploadedFiles', () => {
        test('should return false when post to delete is not found', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([{ id: 1 }]));

            const result = await postModel.deletePost(999);

            expect(result).toBe(false);
            expect(fs.unlink).not.toHaveBeenCalled();
        });

        test('should delete post and handle non-array file property gracefully', async () => {
            const existingPosts = [{ id: 1, title: 'No Attachments' }, { id: 2, title: 'Keep Me' }];
            fs.readFile.mockResolvedValue(JSON.stringify(existingPosts));

            const result = await postModel.deletePost('1');

            expect(result).toBe(true);
            expect(fs.unlink).not.toHaveBeenCalled();
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedFilePath,
                JSON.stringify([{ id: 2, title: 'Keep Me' }], null, 2),
                'utf8'
            );
        });

        test('should delete post, unlink valid attachment paths, skip invalid entries, and ignore unlink errors', async () => {
            const existingPosts = [
                {
                    id: 1,
                    title: 'With Attachments',
                    file: [
                        null,
                        { name: 'missing-path.txt' },
                        { path: 'uploadFiles/missing-on-disk.pdf' },
                        { path: 'uploadFiles/valid.pdf' }
                    ]
                }
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(existingPosts));
            fs.unlink
                .mockRejectedValueOnce(new Error('ENOENT: file already gone'))
                .mockResolvedValueOnce();

            const result = await postModel.deletePost(1);

            expect(result).toBe(true);
            expect(fs.unlink).toHaveBeenCalledTimes(2);
            expect(fs.unlink).toHaveBeenNthCalledWith(1, 'uploadFiles/missing-on-disk.pdf');
            expect(fs.unlink).toHaveBeenNthCalledWith(2, 'uploadFiles/valid.pdf');
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedFilePath,
                JSON.stringify([], null, 2),
                'utf8'
            );
        });
    });

    describe('commentPost', () => {
        test('should return null when target post is not found', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([]));

            const result = await postModel.commentPost(1, { commentId: 1, text: 'Hello' });

            expect(result).toBeNull();
        });

        test('should initialize comments array if missing and append comment', async () => {
            const existingPosts = [{ id: 1, title: 'Legacy Post Without Comments Field' }];
            fs.readFile.mockResolvedValue(JSON.stringify(existingPosts));

            const comment = { commentId: 101, text: 'First comment' };
            const result = await postModel.commentPost('1', comment);

            expect(result.comments).toEqual([comment]);
        });

        test('should append comment to existing comments array', async () => {
            const existingPosts = [
                { id: 1, title: 'Post', comments: [{ commentId: 101, text: 'First' }] }
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(existingPosts));

            const newComment = { commentId: 102, text: 'Second' };
            const result = await postModel.commentPost(1, newComment);

            expect(result.comments).toEqual([
                { commentId: 101, text: 'First' },
                newComment
            ]);
        });
    });

    describe('deleteComment', () => {
        test('should return null when post is not found', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([]));

            const result = await postModel.deleteComment(1, 101);

            expect(result).toBeNull();
        });

        test('should return null when post comments is not an array', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([{ id: 1 }]));

            const result = await postModel.deleteComment(1, 101);

            expect(result).toBeNull();
        });

        test('should return null when commentId is not found in post', async () => {
            const existingPosts = [{ id: 1, comments: [{ commentId: 101, text: 'Keep' }] }];
            fs.readFile.mockResolvedValue(JSON.stringify(existingPosts));

            const result = await postModel.deleteComment(1, 999);

            expect(result).toBeNull();
        });

        test('should remove matching comment and return updated post', async () => {
            const existingPosts = [
                {
                    id: 1,
                    comments: [
                        { commentId: 101, text: 'Remove me' },
                        { commentId: 102, text: 'Keep me' }
                    ]
                }
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(existingPosts));

            const result = await postModel.deleteComment('1', '101');

            expect(result.comments).toEqual([{ commentId: 102, text: 'Keep me' }]);
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedFilePath,
                JSON.stringify([{ id: 1, comments: [{ commentId: 102, text: 'Keep me' }] }], null, 2),
                'utf8'
            );
        });
    });
});