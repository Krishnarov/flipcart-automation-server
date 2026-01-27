import express from 'express';
import { startJob } from '../controllers/automation.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Temporary: Remove authMiddleware if not fully setup for testing
router.post('/start/:jobId', startJob);

export default router;
