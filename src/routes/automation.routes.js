import express from 'express';
import { startJob, retryJob, retryTask } from '../controllers/automation.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Temporary: Remove authMiddleware if not fully setup for testing
router.post('/start/:jobId', startJob);
router.post('/retry-job/:jobId', retryJob);
router.post('/retry-task/:taskId', retryTask);

export default router;
