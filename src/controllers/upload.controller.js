import { parseExcelData } from '../services/excel.service.js';
import AutomationJob from '../models/AutomationJob.js';
import PurchaseTask from '../models/PurchaseTask.js';
import CancelTask from '../models/CancelTask.js';

export const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { type = 'purchase' } = req.body;

        // 1. Create Automation Job in DB
        const job = new AutomationJob({
            userId: req.user?._id || '65b3a8a3f1a2c3d4e5f6a7b8', // Placeholder
            uploadFile: req.file.path,
            type
        });
        await job.save();

        // 2. Parse Excel and Create Tasks
        const taskData = parseExcelData(req.file.path, type);
        const tasks = taskData.map(data => ({
            ...data,
            jobId: job._id,
        }));

        if (type === 'cancel') {
            await CancelTask.insertMany(tasks);
        } else {
            await PurchaseTask.insertMany(tasks);
        }

        res.status(201).json({
            message: `File uploaded successfully. ${type} Job is pending.`,
            jobId: job._id,
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
