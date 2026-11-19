const adminModel = require('../models/adminmodel');
const postModel = require('../models/postmodel');
const loginModel = require('../models/loginmodel');

jest.mock('../models/postmodel');
jest.mock('../models/loginmodel');

describe('adminmodel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllUsers', () => {
        test('should return all users from loginModel', async () => {
            const mockUsers = [
                { username: 'alice', status: 'normal' },
                { username: 'bob', status: 'banned' }
            ];
            loginModel.readUsersFromFile.mockResolvedValue(mockUsers);

            const result = await adminModel.getAllUsers();

            expect(loginModel.readUsersFromFile).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockUsers);
        });
    });

    describe('getAllPosts', () => {
        test('should return all posts from postModel', async () => {
            const mockPosts = [{ id: 1, title: 'Hello' }, { id: 2, title: 'World' }];
            postModel.getPosts.mockResolvedValue(mockPosts);

            const result = await adminModel.getAllPosts();

            expect(postModel.getPosts).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockPosts);
        });
    });

    describe('banAccount', () => {
        test('should return null when user is not found', async () => {
            loginModel.readUsersFromFile.mockResolvedValue([{ username: 'alice', status: 'normal' }]);

            const result = await adminModel.banAccount('nonexistent');

            expect(result).toBeNull();
            expect(loginModel.writeUsersToFile).not.toHaveBeenCalled();
        });

        test('should toggle status from normal to banned when forceStatus is not provided', async () => {
            const mockUsers = [{ username: 'alice', status: 'normal' }];
            loginModel.readUsersFromFile.mockResolvedValue(mockUsers);
            loginModel.writeUsersToFile.mockResolvedValue();

            const result = await adminModel.banAccount('alice');

            expect(result.status).toBe('banned');
            expect(result.updatedAt).toBeDefined();
            expect(new Date(result.updatedAt).toISOString()).toBe(result.updatedAt);
            expect(loginModel.writeUsersToFile).toHaveBeenCalledWith(mockUsers);
        });

        test('should treat missing status as normal and toggle to banned', async () => {
            const mockUsers = [{ username: 'charlie' }]; // covers `users[index].status || 'normal'`
            loginModel.readUsersFromFile.mockResolvedValue(mockUsers);
            loginModel.writeUsersToFile.mockResolvedValue();

            const result = await adminModel.banAccount('charlie');

            expect(result.status).toBe('banned');
            expect(result.updatedAt).toBeDefined();
            expect(loginModel.writeUsersToFile).toHaveBeenCalledWith(mockUsers);
        });

        test('should toggle status from banned to normal when forceStatus is not provided', async () => {
            const mockUsers = [{ username: 'bob', status: 'banned' }];
            loginModel.readUsersFromFile.mockResolvedValue(mockUsers);
            loginModel.writeUsersToFile.mockResolvedValue();

            const result = await adminModel.banAccount('bob');

            expect(result.status).toBe('normal');
            expect(result.updatedAt).toBeDefined();
            expect(loginModel.writeUsersToFile).toHaveBeenCalledWith(mockUsers);
        });

        test('should set explicit status when forceStatus is provided', async () => {
            const mockUsers = [{ username: 'alice', status: 'banned' }];
            loginModel.readUsersFromFile.mockResolvedValue(mockUsers);
            loginModel.writeUsersToFile.mockResolvedValue();

            const result = await adminModel.banAccount('alice', 'suspended');

            expect(result.status).toBe('suspended');
            expect(result.updatedAt).toBeDefined();
            expect(loginModel.writeUsersToFile).toHaveBeenCalledWith(mockUsers);
        });
    });

    describe('deleteAccount', () => {
        test('should return false when user is not found', async () => {
            loginModel.readUsersFromFile.mockResolvedValue([{ username: 'alice' }]);

            const result = await adminModel.deleteAccount('nonexistent');

            expect(result).toBe(false);
            expect(loginModel.writeUsersToFile).not.toHaveBeenCalled();
        });

        test('should remove user, save file, and return true when user exists', async () => {
            const mockUsers = [{ username: 'alice' }, { username: 'bob' }];
            loginModel.readUsersFromFile.mockResolvedValue(mockUsers);
            loginModel.writeUsersToFile.mockResolvedValue();

            const result = await adminModel.deleteAccount('alice');

            expect(result).toBe(true);
            expect(loginModel.writeUsersToFile).toHaveBeenCalledWith([{ username: 'bob' }]);
        });
    });

    describe('deletePost', () => {
        test('should call postModel.deletePost with postId and return its result', async () => {
            postModel.deletePost.mockResolvedValue(true);

            const result = await adminModel.deletePost('post-123');

            expect(postModel.deletePost).toHaveBeenCalledWith('post-123');
            expect(result).toBe(true);
        });
    });

    describe('deleteComment', () => {
        test('should call postModel.deleteComment with postId and commentId and return its result', async () => {
            postModel.deleteComment.mockResolvedValue(true);

            const result = await adminModel.deleteComment('post-123', 'comment-456');

            expect(postModel.deleteComment).toHaveBeenCalledWith('post-123', 'comment-456');
            expect(result).toBe(true);
        });
    });
});