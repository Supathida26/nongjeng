const fs = require('fs/promises');
const path = require('path');
const reportModel = require('../models/reportmodel');

jest.mock('fs/promises');

const expectedDataDir = path.join(__dirname, '../data');
const expectedReportPath = path.join(expectedDataDir, 'report.json');

describe('reportmodel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fs.mkdir.mockResolvedValue();
        fs.writeFile.mockResolvedValue();
    });

    describe('getAllReports & readReportsFromFile', () => {
        test('should return parsed reports array when report.json contains a valid array', async () => {
            const mockReports = [{ reportId: 1, type: 'note', status: 'pending' }];
            fs.readFile.mockResolvedValue(JSON.stringify(mockReports));

            const result = await reportModel.getAllReports();

            expect(fs.readFile).toHaveBeenCalledWith(expectedReportPath, 'utf8');
            expect(result).toEqual(mockReports);
        });

        test('should return empty array when JSON content is not an array', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify({ reportId: 1 }));

            const result = await reportModel.getAllReports();

            expect(result).toEqual([]);
        });

        test('should return empty array when reading or parsing report.json fails', async () => {
            const enoentError = new Error('ENOENT');
            enoentError.code = 'ENOENT';
            fs.readFile.mockRejectedValue(enoentError);

            const result = await reportModel.getAllReports();

            expect(result).toEqual([]);
        });
    });

    describe('createReport', () => {
        test('should create a report using default fallbacks when optional fields are omitted', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([]));

            const result = await reportModel.createReport({
                reason: 'Spam content'
            });

            expect(result).toMatchObject({
                type: 'note',
                postId: null,
                targetUsername: null,
                commentId: null,
                reporterUsername: 'Anonymous',
                reason: 'Spam content',
                status: 'pending'
            });
            expect(typeof result.reportId).toBe('number');
            expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt);
            expect(fs.mkdir).toHaveBeenCalledWith(expectedDataDir, { recursive: true });
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedReportPath,
                JSON.stringify([result], null, 2),
                'utf8'
            );
        });

        test('should create a report with all explicit fields and numeric ID coercion', async () => {
            const existingReports = [{ reportId: 100, type: 'note', status: 'resolved' }];
            fs.readFile.mockResolvedValue(JSON.stringify(existingReports));

            const result = await reportModel.createReport({
                type: 'comment',
                postId: '42',
                targetUsername: 'baduser',
                commentId: '99',
                reporterUsername: 'alice',
                reason: 'Harassment'
            });

            expect(result).toMatchObject({
                type: 'comment',
                postId: 42,
                targetUsername: 'baduser',
                commentId: 99,
                reporterUsername: 'alice',
                reason: 'Harassment',
                status: 'pending'
            });
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedReportPath,
                JSON.stringify([...existingReports, result], null, 2),
                'utf8'
            );
        });
    });

    describe('resolveReport', () => {
        test('should return null when reportId is not found', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([{ reportId: 1, status: 'pending' }]));

            const result = await reportModel.resolveReport(999);

            expect(result).toBeNull();
            expect(fs.writeFile).not.toHaveBeenCalled();
        });

        /*test('should mark report as resolved, set updatedAt, and save to file', async () => {
            const mockReports = [
                { reportId: 1, status: 'pending' },
                { reportId: 2, status: 'pending' }
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(mockReports));

            const result = await reportModel.resolveReport('2');

            //expect(result.reportId).toBe(1);
            expect(result.reportId).toBe(2);
            expect(result.status).toBe('resolved');
            expect(result.updatedAt).toBeDefined();
            expect(new Date(result.updatedAt).toISOString()).toBe(result.updatedAt);
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedReportPath,
                JSON.stringify(mockReports, null, 2),
                'utf8'
            );
        });*/

        test('should mark report as resolved, set updatedAt, and save to file', async () => {
            const mockReports = [
                { reportId: 1, status: 'pending' },
                { reportId: 2, status: 'pending' }
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(mockReports));

            const result = await reportModel.resolveReport('2');

            expect(result.reportId).toBe(2);
            expect(result.status).toBe('resolved');
            expect(result.updatedAt).toBeDefined();
            expect(new Date(result.updatedAt).toISOString()).toBe(result.updatedAt);
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedReportPath,
                JSON.stringify([mockReports[0], result], null, 2),
                'utf8'
            );
        });

    });

    describe('deleteReport', () => {
        test('should return false when reportId is not found', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify([{ reportId: 1, status: 'pending' }]));

            const result = await reportModel.deleteReport(999);

            expect(result).toBe(false);
            expect(fs.writeFile).not.toHaveBeenCalled();
        });

        test('should remove matching report, save updated list, and return true', async () => {
            const mockReports = [
                { reportId: 1, reason: 'First' },
                { reportId: 2, reason: 'Second' }
            ];
            fs.readFile.mockResolvedValue(JSON.stringify(mockReports));

            const result = await reportModel.deleteReport('1');

            expect(result).toBe(true);
            expect(fs.writeFile).toHaveBeenCalledWith(
                expectedReportPath,
                JSON.stringify([{ reportId: 2, reason: 'Second' }], null, 2),
                'utf8'
            );
        });
    });
});