import { delay } from './utils.js';

/**
 * Executes the cancellation flow for an order.
 * @param {import('playwright').Page} page
 * @param {Object} task - The CancelTask object containing orderId
 */
export const executeCancellation = async (page, task, updateStatus = async () => { }) => {
    try {
        await updateStatus(`Navigating to Order Details for ID: ${task.orderId}`);
        console.log(`🚀 Starting cancellation for Order ID: ${task.orderId}`);
        // 1. Navigate to Order Details page directly
        await page.goto(`https://www.flipkart.com/order_details?order_id=${task.orderId}`, { waitUntil: 'networkidle' });

        await page.waitForLoadState('networkidle');
        // 3️⃣ Cancel button (TEXT based – safest)
        const cancelBtn = page.getByText(/^cancel$/i);


        try {
            await updateStatus('Looking for Cancel button');
            await cancelBtn.waitFor({ state: "visible", timeout: 15000 });
            console.log("🟢 Cancel button found on order details page");
        } catch {
            await updateStatus('Order not found directly, searching in list');
            console.log("🔁 Cancel button not found, searching order in list");

            const orderLink = page.getByText(task.orderId);

            if (await orderLink.count() > 0) {
                await orderLink.first().click();
                await page.waitForLoadState("networkidle");

                // wait again for cancel
                await cancelBtn.waitFor({ state: "visible", timeout: 15000 });
            } else {
                throw new Error("Order not found in list");
            }
        }

        // 5️⃣ Click Cancel
        await updateStatus('Clicking Initial Cancel');
        await cancelBtn.click();
        console.log("🛑 Cancel button clicked");
        const cancelOrderBtn = page.getByText(/^cancel Order$/i);
        await cancelOrderBtn.waitFor({ state: "visible", timeout: 15000 });
        await updateStatus('Confirming Cancellation');
        await cancelOrderBtn.click();
        await page.waitForLoadState("networkidle");
        const reasonValue = task.reasonvalue;

        await page.waitForSelector('select[name="reasonList"]', {
            state: "attached",
            timeout: 15000,
        });

        await updateStatus('Selecting cancellation reason');
        await page.evaluate((value) => {
            const select = document.querySelector('select[name="reasonList"]');
            if (!select) throw new Error("Reason select not found");

            select.value = value || "mind_changed";

            // React/Flipkart listeners trigger
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }, reasonValue);

        console.log("✅ Cancel reason selected:", reasonValue);
        await page.locator('textarea[maxlength="1000"]').fill(task.reasontext || "I have changed my mind");

        await updateStatus('Submitting cancellation request');
        await page.getByRole("button", { name: /CONTINUE/i }).click();
        await page.waitForLoadState("networkidle");
        const codRadio = page.locator('label[for="COD"]');

        await codRadio.waitFor({ state: "visible", timeout: 15000 });
        await codRadio.click();
        await updateStatus('Finalizing cancellation');
        await page.getByRole("button", { name: /Request Cancellation/i }).click();

        console.log("✅ COD radio option selected");

        await page.waitForLoadState("networkidle");

        // 📸 TAKE SCREENSHOT
        const screenshotPath = `screenshots/cancel-success-${task._id}.png`;
        await page.screenshot({
            path: screenshotPath,
            fullPage: true,
        });
        console.log("📸 Screenshot saved at:", screenshotPath);

        return { success: true, reason: 'Order cancelled successfully' };
    } catch (error) {
        console.error('Cancellation Error:', error.message);
        return { success: false, reason: error.message };
    }
};
