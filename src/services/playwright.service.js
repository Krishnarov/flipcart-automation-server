import { chromium } from 'playwright';
import PurchaseTask from '../models/PurchaseTask.js';
import AutomationJob from '../models/AutomationJob.js';
import { loginToFlipkart, loginToFlipkartWithOTP } from '../playwright/login.js';
import { executePurchase } from '../playwright/purchase.js';
import playwrightConfig from '../config/playwright.js';
import { loginToEmail } from '../playwright/loginToEmail.js';
import { delay } from '../playwright/utils.js';

/**
 * Runs the automation flow for all tasks in a job.
 * @param {string} jobId - The ID of the AutomationJob.
 */
export const runAutomation = async (jobId) => {
    console.log("🟢 runAutomation started for job:", jobId);
    const context = await chromium.launchPersistentContext(
        "./gmail-session",
        playwrightConfig
    );

    const flipkartPage = await context.newPage();
    let emailPage;

    try {
        const tasks = await PurchaseTask.find({ jobId });
        console.log("🟢 Tasks found:", tasks.length);
        let currentLoggedInEmail = null;

        for (const task of tasks) {
            console.log(`Processing task ${task._id} for ${task.email}`);

            try {
                // Login if it's a new email or first task
                if (currentLoggedInEmail !== task.email) {
                    await loginToFlipkart(flipkartPage, task.email);
                    await delay(10000);
                    emailPage = await context.newPage();
                    console.log("🟢 New page created");
                    // OTP Gmail se lao
                    const otp = await loginToEmail(emailPage);
                    console.log("🟢 OTP received:", otp);
                    // Flipkart tab me wapas
                    await flipkartPage.bringToFront();
                    // OTP fill
                    await loginToFlipkartWithOTP(flipkartPage, otp);
                    currentLoggedInEmail = task.email;
                }
                await delay(10000);
                await executePurchase(flipkartPage, task);

            } catch (error) {
                console.error(`Task ${task._id} failed:`, error.message);
                await PurchaseTask.findByIdAndUpdate(task._id, {
                    status: 'failed',
                    reason: error.message,
                });
            }
        }

        // await AutomationJob.findByIdAndUpdate(jobId, { status: 'completed' });
    } catch (error) {
        console.error(`Automation Job ${jobId} failed:`, error.message);
        await AutomationJob.findByIdAndUpdate(jobId, { status: 'failed' });
    }
};
