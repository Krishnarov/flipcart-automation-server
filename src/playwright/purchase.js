import { delay } from './utils.js';

/**
 * Executes the purchase flow for a product.
 * @param {import('playwright').Page} page
 * @param {string} productLink
 * @param {string} address
 */
export const executePurchase = async (page, task) => {
    try {
        await page.goto(task.productLink, { waitUntil: 'networkidle' });

        // 1️⃣ Sold Out check
        const soldOut = page.getByText(/sold out/i);
        if ((await soldOut.count()) > 0 && await soldOut.first().isVisible()) {
            console.log("❌ Product is Sold Out");
            return { success: false, reason: "Sold Out" };
        }

        // 2️⃣ Out of Stock check
        const outOfStock = page.getByText(/out of stock/i);
        if ((await outOfStock.count()) > 0 && await outOfStock.first().isVisible()) {
            console.log("❌ Product is Out of Stock");
            return { success: false, reason: "Out of Stock" };
        }

        await page.getByRole("button", { name: /buy now/i }).click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        const addNewAddressButton = page.getByText(/Add a new address/i);
        if ((await addNewAddressButton.count()) > 0 && await addNewAddressButton.first().isVisible()) {
            await addNewAddressButton.click();
        }
        await page.locator('input[name="name"]').fill(task.name);
        await page.locator('input[name="phone"]').fill(task.phone);
        await page.locator('input[name="pincode"]').fill(task.pincode);
        await page.locator('input[name="addressLine2"]').fill(task.addressLine2);
        await page.locator('textarea[name="addressLine1"]').fill(task.addressLine1);
        await page.locator('input[name="city"]').fill(task.city);
        await page
            .locator('select[name="state"]')
            .selectOption({ label: "Uttar Pradesh" });
        await page.locator('input[name="landmark"]').fill(task.landmark);
        await page
            .locator('input[name="alternatePhone"]')
            .fill(task.alternatePhone);
        await page.getByText("Home (All day delivery)").click();

        await page.waitForTimeout(3000);
        await page
            .getByRole("button", { name: /Save and Deliver Here/i })
            .click();




        return { success: true };
    } catch (error) {
        console.error('Purchase Error:', error.message);
        return { success: false, reason: error.message };
    }
};
