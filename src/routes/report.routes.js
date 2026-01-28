import express from 'express';
import { getJobs, getJobDetails, getStats } from '../controllers/report.controller.js';

const router = express.Router();

router.get('/jobs', getJobs);
router.get('/jobs/:jobId', getJobDetails);
router.get('/stats', getStats);

export default router;
