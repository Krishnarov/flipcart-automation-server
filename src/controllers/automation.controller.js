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
        // if (job.status === 'completed') {
        //     return res.status(400).json({ message: 'Job is already completed' });
        // }

        let tasks;
        if (job.type === 'cancel') {
            tasks = await CancelTask.find({ jobId, status: { $ne: 'success' } });
        } else {
            tasks = await PurchaseTask.find({ jobId, status: { $ne: 'success' } });
        }

        if (tasks.length === 0) {
            return res.status(404).json({ message: 'No pending or failed tasks found for this job' });
        }

        // Update status to running
        job.status = 'running';
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

export const retryJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await AutomationJob.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        if (job.status === 'running') {
            return res.status(400).json({ message: 'Job is already running' });
        }

        // Reset failed tasks to pending
        if (job.type === 'cancel') {
            await CancelTask.updateMany({ jobId, status: 'failed' }, { status: 'pending', reason: 'Retrying...' });
        } else {
            await PurchaseTask.updateMany({ jobId, status: 'failed' }, { status: 'pending', reason: 'Retrying...' });
        }

        job.status = 'running';
        await job.save();

        runAutomation(jobId);
        res.status(200).json({ message: 'Retry started for failed tasks' });
    } catch (error) {
        console.error('Retry Job Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const retryTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { type } = req.query; // 'cancel' or 'purchase'

        let task;
        if (type === 'cancel') {
            task = await CancelTask.findById(taskId);
        } else {
            task = await PurchaseTask.findById(taskId);
        }

        if (!task) return res.status(404).json({ message: 'Task not found' });

        const job = await AutomationJob.findById(task.jobId);
        if (job.status === 'running') {
            return res.status(400).json({ message: 'Automation is already running for this job' });
        }

        task.status = 'pending';
        task.reason = 'Retrying specific task...';
        await task.save();

        job.status = 'running';
        await job.save();

        runAutomation(job._id, task._id);
        res.status(200).json({ message: 'Retry started for task' });
    } catch (error) {
        console.error('Retry Task Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
