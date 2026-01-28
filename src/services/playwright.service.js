import { chromium } from 'playwright';
import PurchaseTask from '../models/PurchaseTask.js';
import CancelTask from '../models/CancelTask.js';
import AutomationJob from '../models/AutomationJob.js';
import { loginToFlipkart, loginToFlipkartWithOTP, openFlipkartPage } from '../playwright/login.js';
import { executePurchase } from '../playwright/purchase.js';
import { executeCancellation } from '../playwright/cancel.js';
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
        const job = await AutomationJob.findById(jobId);
        if (!job) throw new Error("Job not found");

        // job.status = 'running';
        // await job.save();

        let tasks;
        let TaskModel;
        let executeFlow;

        if (job.type === 'cancel') {
            tasks = await CancelTask.find({ jobId });
            TaskModel = CancelTask;
            executeFlow = executeCancellation;
        } else {
            tasks = await PurchaseTask.find({ jobId });
            TaskModel = PurchaseTask;
            executeFlow = executePurchase;
        }

        console.log(`🟢 Tasks found (${job.type}):`, tasks.length);

        for (const task of tasks) {
            console.log(`Processing task ${task._id} for ${task.email}`);

            try {
                const isLoggedIn = await openFlipkartPage(flipkartPage);
                console.log("🟢 isLoggedIn:", isLoggedIn);

                if (!isLoggedIn) {
                    await loginToFlipkart(flipkartPage, task.email);
                    await delay(10000);
                    emailPage = await context.newPage();
                    console.log("🟢 New page created for OTP");

                    const otp = await loginToEmail(emailPage);
                    console.log("🟢 OTP received:", otp);

                    await flipkartPage.bringToFront();
                    await loginToFlipkartWithOTP(flipkartPage, otp);
                    await flipkartPage.waitForTimeout(5000);

                    const stillLogin = await flipkartPage
                        .getByRole("link", { name: /login/i })
                        .count();
                    if (stillLogin > 0) {
                        throw new Error("Login failed even after OTP");
                    }
                    if (emailPage) await emailPage.close();
                } else {
                    console.log("➡️ Skipping login, already authenticated");
                }

                const result = await executeFlow(flipkartPage, task);

                await TaskModel.findByIdAndUpdate(task._id, {
                    status: result.success ? 'success' : 'failed',
                    reason: result.reason || (result.success ? '' : 'Unknown Error'),
                });

            } catch (error) {
                console.error(`Task ${task._id} failed:`, error.message);
                await TaskModel.findByIdAndUpdate(task._id, {
                    status: 'failed',
                    reason: error.message,
                });
            }
        }

        await AutomationJob.findByIdAndUpdate(jobId, { status: 'completed' });
    } catch (error) {
        console.error(`Automation Job ${jobId} failed:`, error.message);
        await AutomationJob.findByIdAndUpdate(jobId, { status: 'failed' });
    } finally {
        await context.close();
    }
};
