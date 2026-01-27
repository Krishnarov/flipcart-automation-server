import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initJobsFromDB } from './services/scheduler.service.js';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    initJobsFromDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
