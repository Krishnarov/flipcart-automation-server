import AutomationJob from '../models/AutomationJob.js';
import PurchaseTask from '../models/PurchaseTask.js';
import CancelTask from '../models/CancelTask.js';

/**
 * Fetches all automation jobs for a user, optionally filtered by type.
 */
export const getJobs = async (req, res) => {
    try {
        const userId = req.user?._id || '65b3a8a3f1a2c3d4e5f6a7b8'; // Placeholder
        const { type } = req.query;

        const query = { userId };
        if (type) {
            query.type = type;
        }

        const jobs = await AutomationJob.find(query).sort({ createdAt: -1 });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs' });
    }
};

/**
 * Fetches all tasks for a specific job.
 */
export const getJobDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await AutomationJob.findById(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        let tasks;
        if (job.type === 'cancel') {
            tasks = await CancelTask.find({ jobId });
        } else {
            tasks = await PurchaseTask.find({ jobId });
        }

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job details' });
    }
};

/**
 * Gets summary stats for the dashboard.
 */
export const getStats = async (req, res) => {
    try {
        const userId = req.user?._id || '65b3a8a3f1a2c3d4e5f6a7b8'; // Placeholder

        const purchaseJobs = await AutomationJob.find({ userId, type: 'purchase' }).distinct('_id');
        const cancelJobs = await AutomationJob.find({ userId, type: 'cancel' }).distinct('_id');

        const purchaseCount = await PurchaseTask.countDocuments({
            status: 'success',
            jobId: { $in: purchaseJobs }
        });

        const cancelCount = await CancelTask.countDocuments({
            status: 'success',
            jobId: { $in: cancelJobs }
        });

        res.status(200).json({
            purchaseCount,
            cancelCount
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

/**
 * Downloads a sample excel file based on type.
 */
export const downloadSample = async (req, res) => {
    try {
        const { type } = req.params;
        // In a real app, these files would exist in a 'public' or 'assets' folder
        // For now, we'll send a message or a mock file if possible
        res.status(200).json({ message: `Sample for ${type} would be downloaded here.` });
    } catch (error) {
        res.status(500).json({ message: 'Error downloading sample' });
    }
};
