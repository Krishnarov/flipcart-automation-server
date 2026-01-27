import AutomationJob from '../models/AutomationJob.js';
import PurchaseTask from '../models/PurchaseTask.js';

/**
 * Fetches all automation jobs for a user.
 */
export const getJobs = async (req, res) => {
    try {
        const userId = req.user?._id || '65b3a8a3f1a2c3d4e5f6a7b8'; // Placeholder
        const jobs = await AutomationJob.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs' });
    }
};

/**
 * Fetches all purchase tasks for a specific job.
 */
export const getJobDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const tasks = await PurchaseTask.find({ jobId });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job details' });
    }
};
