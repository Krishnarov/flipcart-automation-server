import { delay } from './utils.js';

/**
 * Executes the purchase flow for a product.
 * @param {import('playwright').Page} page
 * @param {string} productLink
 * @param {string} address
 */
const PURCHASE_ERRORS = [
    /item not available for purchase/i,
    /not available for purchase/i,
    /cannot be delivered/i,
    /seller does not deliver/i,
    /currently unavailable/i,
];
const detectPurchaseError = async (page) => {
    for (const pattern of PURCHASE_ERRORS) {
        const errorEl = page.getByText(pattern);
        if ((await errorEl.count()) > 0 && await errorEl.first().isVisible()) {
            const text = await errorEl.first().innerText();
            return text;
        }
    }
    return null;
};

const openAddressFormSafely = async (page) => {
    const addressForm = await page.locator('input[name="name"]');

    // 🔁 Try multiple times because Flipkart UI is async
    for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔁 Address resolver attempt ${attempt}`);

        // CASE 1: Form already open
        if (await addressForm.count() > 0 && await addressForm.first().isVisible()) {
            console.log("🟢 Address form visible");
            return;
        }

        // CASE 2: Add new address button visible
        const addNewBtn = page.getByText(/add a new address/i);
        if (await addNewBtn.count() > 0 && await addNewBtn.first().isVisible()) {
            console.log("🟢 Clicking Add New Address");
            await addNewBtn.first().click();
            await page.waitForSelector('input[name="name"]', {
                state: "visible",
                timeout: 15000
            })
            continue;
        }

        // CASE 3: Existing address selected → Change
        const deliveryBlock = page.locator('div', {
            hasText: 'Delivery Address',
        });

        if (await deliveryBlock.count() > 0) {
            const changeBtns = deliveryBlock.locator('button', {
                hasText: 'Change',
            });

            if (await changeBtns.count() > 0) {
                console.log("🔁 Clicking Delivery Address → Change");
                await changeBtns.nth(Math.min(1, (await changeBtns.count()) - 1)).click();
                await page.waitForLoadState("networkidle");
                await addNewBtn.first().click();
                continue;
            }
        }

        // Wait a bit and retry
        await page.waitForTimeout(2000);
    }

    throw new Error("Address form could not be opened");
};

export const executePurchase = async (page, task) => {
    try {
        await page.goto(task.productlink, { waitUntil: 'networkidle' });

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
        // 🔍 Detect Flipkart error
        const purchaseError = await detectPurchaseError(page);
        if (purchaseError) {
            console.log("❌ Purchase blocked by Flipkart:", purchaseError);
            return {
                success: false,
                reason: purchaseError,
            };
        }
        await openAddressFormSafely(page);


        await page.locator('input[name="name"]').fill(task.name);
        await page.locator('input[name="phone"]').fill(task.phone);
        await page.locator('input[name="pincode"]').fill(task.pincode);
        await page.locator('input[name="addressLine2"]').fill(task.addressline2);
        await page.locator('textarea[name="addressLine1"]').fill(task.addressline1);
        await page.locator('input[name="city"]').fill(task.city);
        await page
            .locator('select[name="state"]')
            .selectOption({ label: "Uttar Pradesh" });
        await page.locator('input[name="landmark"]').fill(task.landmark);
        await page
            .locator('input[name="alternatePhone"]')
            .fill(task.alternatephone);
        await page.getByText("Home (All day delivery)").click();

        await page.waitForTimeout(3000);
        await page
            .getByRole("button", { name: /Save and Deliver Here/i })
            .click();

        await page.waitForTimeout(3000);
        await page.getByRole("button", { name: /CONTINUE/i }).click();
        await page.waitForTimeout(3000);
        // 🔄 Accept terms (if shown)
        const acceptBtn = page.getByRole("button", { name: /accept & continue/i });
        if (await acceptBtn.count() > 0 && await acceptBtn.first().isVisible()) {
            await acceptBtn.first().click();
        }
        await page.waitForTimeout(3000);
        // 💰 COD CHECK STARTS HERE
        const codOption = await page.getByText(/Cash on Delivery/i);
        // ❌ Case 1: COD option hi nahi
        if (await codOption.count() === 0) {
            console.log("❌ COD option not found");

            return {
                success: false,
                reason: "COD Not Available",
            };
        }
        // ❌ Case 2: COD option disabled
        if (!(await codOption.first().isEnabled())) {
            console.log("❌ COD option disabled");

            return {
                success: false,
                reason: "COD Not Available",
            };
        }
        // ❌ Case 3: COD not available message
        const codBlockedMsg = page.getByText(/cod.*not available|cash on delivery.*not available/i);
        if (await codBlockedMsg.count() > 0) {
            console.log("❌ COD not available message");

            return {
                success: false,
                reason: "COD Not Available",
            };
        }
        // ✅ COD available → select it
        await codOption.first().click();
        // 🛒 PLACE ORDER
        const placeOrderBtn = page.getByRole("button", { name: /place order/i });
        await placeOrderBtn.waitFor({ state: "visible", timeout: 15000 });
        await placeOrderBtn.click();
        const orderConfirm = page.getByRole("button", { name: /Confirm order/i });
        await orderConfirm.waitFor({ state: "visible", timeout: 15000 });
        await orderConfirm.click();
        console.log("✅ Order placed successfully");
        // Optional popup handling
        const denyBtn = page.getByRole("button", { name: /deny/i });
        if (await denyBtn.count() > 0 && await denyBtn.first().isVisible()) {
            await denyBtn.first().click();
        }
        await page.waitForTimeout(3000);
        // 📸 TAKE SCREENSHOT
        const screenshotPath = `screenshots/${task._id}-order-success}.png`;
        await page.screenshot({
            path: screenshotPath,
            fullPage: true,
        });
        console.log("📸 Screenshot saved at:", screenshotPath);


        return { success: true };
    } catch (error) {
        console.error('Purchase Error:', error.message);
        return { success: false, reason: error.message };
    }
};
