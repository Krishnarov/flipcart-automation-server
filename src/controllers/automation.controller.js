import AutomationJob from '../models/AutomationJob.js';
import { runAutomation } from '../services/playwright.service.js';
import PurchaseTask from '../models/PurchaseTask.js';

export const startJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        console.log("🚀 startJob API hit");
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
        const tasks = await PurchaseTask.find({ jobId });
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
