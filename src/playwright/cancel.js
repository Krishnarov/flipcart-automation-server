import { delay } from './utils.js';

/**
 * Executes the cancellation flow for an order.
 * @param {import('playwright').Page} page
 * @param {Object} task - The CancelTask object containing orderId
 */
export const executeCancellation = async (page, task) => {
    try {
        console.log(`🚀 Starting cancellation for Order ID: ${task.orderId}`);
        // 1. Navigate to Order Details page directly
        await page.goto(`https://www.flipkart.com/order_details?order_id=${task.orderId}`, { waitUntil: 'networkidle' });

        await page.waitForLoadState('networkidle');
        // 3️⃣ Cancel button (TEXT based – safest)
        const cancelBtn = page.getByText(/^cancel$/i);


        try {
            await cancelBtn.waitFor({ state: "visible", timeout: 15000 });
            console.log("🟢 Cancel button found on order details page");
        } catch {
            console.log("🔁 Cancel button not found, searching order in list");

            const orderLink = page.getByText(task.orderId);

            if (await orderLink.count() > 0) {
                await orderLink.first().click();
                await page.waitForLoadState("domcontentloaded");

                // wait again for cancel
                await cancelBtn.waitFor({ state: "visible", timeout: 15000 });
            } else {
                throw new Error("Order not found in list");
            }
        }

        // 5️⃣ Click Cancel
        await cancelBtn.click();
        console.log("🛑 Cancel button clicked");
        const cancelOrderBtn = page.getByText(/^cancel Order$/i);
        await cancelOrderBtn.waitFor({ state: "visible", timeout: 15000 });
        await cancelOrderBtn.click();
        await page.waitForLoadState("networkidle");
        const reasonValue = "mind_changed";

        await page.waitForSelector('select[name="reasonList"]', {
            state: "attached",
            timeout: 15000,
        });

        await page.evaluate((value) => {
            const select = document.querySelector('select[name="reasonList"]');
            if (!select) throw new Error("Reason select not found");

            select.value = value;

            // React/Flipkart listeners trigger
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }, reasonValue);

        console.log("✅ Cancel reason selected:", reasonValue);
        await page.locator('textarea[maxlength="1000"]').fill('maxlength');

        await page.getByRole("button", { name: /CONTINUE/i }).click();
        await page.waitForLoadState("networkidle");
        const codRadio = page.locator('label[for="COD"]');

        await codRadio.waitFor({ state: "visible", timeout: 15000 });
        await codRadio.click();
        await page.getByRole("button", { name: /Request Cancellation/i }).click();

        console.log("✅ COD radio option selected");

        await page.waitForTimeout(3000);

        // 📸 TAKE SCREENSHOT
        const screenshotPath = `screenshots/${task._id}-cancel-success.png`;
        await page.screenshot({
            path: screenshotPath,
            fullPage: true,
        });
        console.log("📸 Screenshot saved at:", screenshotPath);

        return { success: true };
    } catch (error) {
        console.error('Cancellation Error:', error.message);
        return { success: false, reason: error.message };
    }
};
