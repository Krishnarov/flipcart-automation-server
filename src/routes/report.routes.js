import express from 'express';
import { getJobs, getJobDetails } from '../controllers/report.controller.js';

const router = express.Router();

router.get('/jobs', getJobs);
router.get('/jobs/:jobId', getJobDetails);

export default router;
