import { parseExcelData } from '../services/excel.service.js';
import AutomationJob from '../models/AutomationJob.js';
import PurchaseTask from '../models/PurchaseTask.js';

export const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // 1. Create Automation Job in DB (Pending status by default)
        const job = new AutomationJob({
            userId: req.user?._id || '65b3a8a3f1a2c3d4e5f6a7b8', // Placeholder
            uploadFile: req.file.path,
        });
        await job.save();

        // 2. Parse Excel and Create Purchase Tasks
        const taskData = parseExcelData(req.file.path);
        const tasks = taskData.map(data => ({
            ...data,
            jobId: job._id,
        }));
        await PurchaseTask.insertMany(tasks);

        res.status(201).json({
            message: 'File uploaded successfully. Job is pending.',
            jobId: job._id,
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
