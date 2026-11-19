const fs = require('fs/promises');
const path = require('path');
const loginModel = require('../models/loginmodel');

jest.mock('fs/promises');

const expectedDataDir = path.join(__dirname, '../data');
const expectedFilePath = path.join(expectedDataDir, 'users.json');

describe('loginmodel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('readUsersFromFile', () => {
        test('should return parsed users array when file contains valid JSON array', async () => {
            const mockUsers = [{ username: 'alice', email: 'alice@example.com' }];
            fs.readFile.mockResolvedValue(JSON.stringify(mockUsers));

            const result = await loginModel.readUsersFromFile();

            expect(fs.readFile).toHaveBeenCalledWith(expectedFilePath, 'utf8');
            expect(result).toEqual(mockUsers);
        });

        test('should return empty array when JSON content is not an array', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify({ username: 'alice' }));

            const result = await loginModel.readUsersFromFile();

            expect(result).toEqual([]);
        });

        test('should return empty array when file does not exist (ENOENT)', async () => {
            const enoentError = new Error('File not found');
            enoentError.code = 'ENOENT';
            fs.readFile.mockRejectedValue(enoentError);

            const result = await loginModel.readUsersFromFile();

            expect(result).toEqual([]);
        });

        test('should rethrow unexpected errors', async () => {
            const permError = new Error('Permission denied');
            permError.code = 'EACCES';
            fs.readFile.mockRejectedValue(permError);

            await expect(loginModel.readUsersFromFile()).rejects.toThrow('Permission denied');
        });
    });

    describe('writeUsersToFile', () => {
        test('should create data directory recursively and write formatted JSON', async () => {
            const mockUsers = [{ username: 'alice' }];
            fs.mkdir.mockResolvedValue();
            fs.writeFile.mockResolvedValue();

            await loginModel.writeUsersToFile(mockUsers);

            expect(fs.mkdir).toHaveBeenCalledWith(expectedDataDir, { recursive: true });
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedFilePath,
                JSON.stringify(mockUsers, null, 2),
                'utf8'
            );
        });
    });

    describe('findByIdentifier', () => {
        test('should find user by username (case-insensitive)', async () => {
            const mockUsers = [
                { username: 'Alice', email: 'alice@example.com' },
                { username: 'Bob', email: 'bob@example.com' }
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(mockUsers));

            const result = await loginModel.findByIdentifier('aLiCe');

            expect(result).toEqual(mockUsers[0]);
        });

        test('should find user by email (case-insensitive) and safely skip missing fields', async () => {
            const mockUsers = [
                { id: 1 }, // covers undefined username?. and email?. optional chaining branches
                { username: 'bob', email: 'Bob@Example.com' }
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(mockUsers));

            const result = await loginModel.findByIdentifier('bob@example.com');

            expect(result).toEqual(mockUsers[1]);
        });

        test('should return null when no user matches identifier', async () => {
            const mockUsers = [{ username: 'alice', email: 'alice@example.com' }];
            fs.readFile.mockResolvedValue(JSON.stringify(mockUsers));

            const result = await loginModel.findByIdentifier('charlie');

            expect(result).toBeNull();
        });
    });

    describe('findByIdentifierAndPassword', () => {
        test('should return user when identifier and password match', async () => {
            const mockUsers = [{ username: 'alice', email: 'alice@example.com', password: 'secret' }];
            fs.readFile.mockResolvedValue(JSON.stringify(mockUsers));

            const result = await loginModel.findByIdentifierAndPassword('alice', 'secret');

            expect(result).toEqual(mockUsers[0]);
        });

        test('should return null when password does not match', async () => {
            const mockUsers = [{ username: 'alice', email: 'alice@example.com', password: 'secret' }];
            fs.readFile.mockResolvedValue(JSON.stringify(mockUsers));

            const result = await loginModel.findByIdentifierAndPassword('alice', 'wrong');

            expect(result).toBeNull();
        });

        test('should return null when user is not found', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([]));

            const result = await loginModel.findByIdentifierAndPassword('ghost', 'secret');

            expect(result).toBeNull();
        });
    });

    describe('createUser', () => {
        test('should create a local user with default role "user" when role is omitted', async () => {
            const existingUsers = [{ id: 1, username: 'existing' }];
            fs.readFile.mockResolvedValue(JSON.stringify(existingUsers));
            fs.mkdir.mockResolvedValue();
            fs.writeFile.mockResolvedValue();

            const result = await loginModel.createUser({
                username: 'alice',
                email: 'alice@example.com',
                password: 'hashed_password'
            });

            expect(result).toMatchObject({
                username: 'alice',
                email: 'alice@example.com',
                password: 'hashed_password',
                role: 'user',
                status: 'normal',
                loginType: 'local'
            });
            expect(typeof result.id).toBe('number');
            expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt);
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedFilePath,
                JSON.stringify([...existingUsers, result], null, 2),
                'utf8'
            );
        });

        test('should create a local user with provided custom role', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([]));
            fs.mkdir.mockResolvedValue();
            fs.writeFile.mockResolvedValue();

            const result = await loginModel.createUser({
                username: 'superadmin',
                email: 'admin@example.com',
                password: 'pw',
                role: 'admin'
            });

            expect(result.role).toBe('admin');
            expect(fs.writeFile).toHaveBeenCalledTimes(1);
        });
    });

    describe('findOrCreateGoogleUser', () => {
        const googlePayload = {
            sub: 'google-uid-123',
            email: 'Jane.Doe@gmail.com',
            name: 'Jane Doe',
            picture: 'https://example.com/jane.jpg'
        };

        test('should return existing user without writing when email already exists', async () => {
            const existingUser = {
                id: 'google-uid-123',
                username: 'jane.doe',
                email: 'jane.doe@gmail.com',
                loginType: 'google'
            };
            const mockUsers = [
                { id: 1, username: 'no_email_user' }, // covers u.email?. undefined branch
                existingUser
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(mockUsers));

            const result = await loginModel.findOrCreateGoogleUser(googlePayload);

            expect(result).toEqual(existingUser);
            expect(fs.writeFile).not.toHaveBeenCalled();
        });

        test('should create, save, and return a new Google user when email is not found', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([]));
            fs.mkdir.mockResolvedValue();
            fs.writeFile.mockResolvedValue();

            const result = await loginModel.findOrCreateGoogleUser(googlePayload);

            expect(result).toMatchObject({
                id: 'google-uid-123',
                username: 'Jane.Doe',
                email: 'Jane.Doe@gmail.com',
                fullName: 'Jane Doe',
                picture: 'https://example.com/jane.jpg',
                role: 'user',
                status: 'normal',
                loginType: 'google'
            });
            expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt);
            expect(fs.mkdir).toHaveBeenCalledWith(expectedDataDir, { recursive: true });
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedFilePath,
                JSON.stringify([result], null, 2),
                'utf8'
            );
        });
    });
});