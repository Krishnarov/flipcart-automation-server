import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import automationRoutes from './routes/automation.routes.js';
import reportRoutes from './routes/report.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('src/uploads'));
// test route
app.get("/", (req, res) => {
    res.send("Flipkart Automation API running 🚀");
});
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/report', reportRoutes);

app.use(errorMiddleware);

export default app;
