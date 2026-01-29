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
    const contextKuku = await chromium.launchPersistentContext(
        "./kuku-session",
        playwrightConfig
    );

    const browser = await chromium.launch(playwrightConfig);
    const context = await browser.newContext();
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
            let currentStep = 'Initiating Login';

            try {
                // await TaskModel.findByIdAndUpdate(task._id, { reason: 'Step: Initiating Login' });
                await loginToFlipkart(flipkartPage, task.email);

                currentStep = 'Waiting for Page Load';
                // await TaskModel.findByIdAndUpdate(task._id, { reason: 'Step: Waiting for Page Load' });
                await flipkartPage.waitForLoadState("networkidle");
                await flipkartPage.waitForTimeout(1000);

                currentStep = 'Accessing OTP Email';
                // await TaskModel.findByIdAndUpdate(task._id, { reason: 'Step: Accessing OTP Email' });
                emailPage = await contextKuku.newPage();
                console.log("🟢 New page created for OTP");

                const otp = await loginToEmail(emailPage, task.email);
                console.log("🟢 OTP received:", otp);

                currentStep = 'Submitting OTP';
                // await TaskModel.findByIdAndUpdate(task._id, { reason: 'Step: Submitting OTP' });
                await flipkartPage.bringToFront();
                await loginToFlipkartWithOTP(flipkartPage, otp);
                await flipkartPage.waitForLoadState("networkidle");

                const stillLogin = await flipkartPage
                    .getByRole("link", { name: /login/i })
                    .count();
                if (stillLogin > 0) {
                    throw new Error("Login failed even after OTP");
                }
                // if (emailPage) await emailPage.close();


                currentStep = 'Executing Purchase/Cancellation Flow';
                // await TaskModel.findByIdAndUpdate(task._id, { reason: 'Step: Executing Purchase/Cancellation Flow' });

                let lastSubStep = '';
                const updateStatus = async (reason) => {
                    lastSubStep = reason;
                    console.log(`Step: ${reason}`);
                };

                const result = await executeFlow(flipkartPage, task, updateStatus);

                const updateData = {
                    status: result.success ? 'success' : 'failed',
                    reason: result.success ? (result.reason || 'Completed successfully') : (result.reason || `Failed at ${currentStep}: ${lastSubStep || 'Unknown error'}`),
                };

                if (result.success && result.orderId) {
                    updateData.orderId = result.orderId;
                }

                await TaskModel.findByIdAndUpdate(task._id, updateData);

            } catch (error) {
                console.error(`Task ${task._id} failed at ${currentStep}:`, error.message);
                await TaskModel.findByIdAndUpdate(task._id, {
                    status: 'failed',
                    reason: `Error at ${currentStep}: ${error.message}`,
                });
            } finally {
                if (emailPage) {
                    await emailPage.close().catch(() => { });
                    emailPage = null;
                }
            }
        }

        await AutomationJob.findByIdAndUpdate(jobId, { status: 'completed' });
    } catch (error) {
        console.error(`Automation Job ${jobId} failed:`, error.message);
        await AutomationJob.findByIdAndUpdate(jobId, {
            status: 'failed',
            reason: error.message
        });
    } finally {
        await context.close();
        if (contextKuku) await contextKuku.close();
    }
};
