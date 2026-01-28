import AutomationJob from '../models/AutomationJob.js';
import { runAutomation } from '../services/playwright.service.js';
import PurchaseTask from '../models/PurchaseTask.js';
import CancelTask from '../models/CancelTask.js';

export const startJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await AutomationJob.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.status === 'running') {
            return res.status(400).json({ message: 'Job is already running' });
        }
        if (job.status === 'completed') {
            return res.status(400).json({ message: 'Job is already completed' });
        }

        let tasks;
        if (job.type === 'cancel') {
            tasks = await CancelTask.find({ jobId });
        } else {
            tasks = await PurchaseTask.find({ jobId });
        }

        if (tasks.length === 0) {
            return res.status(404).json({ message: 'No tasks found for this job' });
        }

        // Update status to running
        // job.status = 'running';
        await job.save();
        // Trigger automation (async)
        console.log("🔥 Triggering runAutomation");
        runAutomation(jobId);



        res.status(200).json({ message: 'Job started successfully' });
    } catch (error) {
        console.error('Start Job Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
