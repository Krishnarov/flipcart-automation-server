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

// const openAddressFormSafely = async (page, name) => {
//     const addressForm = await page.locator('input[name="name"]');

//     // 🔁 Try multiple times because Flipkart UI is async
//     for (let attempt = 1; attempt <= 3; attempt++) {
//         console.log(`🔁 Address resolver attempt ${attempt}`);

//         // CASE 1: Form already open
//         if (await addressForm.count() > 0 && await addressForm.first().isVisible()) {
//             console.log("🟢 Address form visible");
//             await addressForm.fill(name);
//             return;
//         }

//         // CASE 2: Add new address button visible
//         const addNewBtn = page.getByText(/add a new address/i);
//         if (await addNewBtn.count() > 0 && await addNewBtn.first().isVisible()) {
//             console.log("🟢 Clicking Add New Address");
//             await addNewBtn.first().click();
//             await page.waitForSelector('input[name="name"]', {
//                 state: "visible",
//                 timeout: 15000
//             })
//             await addressForm.fill(name);
//             continue;
//         }

//         // CASE 3: Existing address selected → Change
//         const deliveryBlock = page.locator('div', {
//             hasText: 'Delivery Address',
//         });

//         if (await deliveryBlock.count() > 0) {
//             const changeBtns = deliveryBlock.locator('button', {
//                 hasText: 'Change',
//             });

//             if (await changeBtns.count() > 0) {
//                 console.log("🔁 Clicking Delivery Address → Change");
//                 await changeBtns.nth(Math.min(1, (await changeBtns.count()) - 1)).click();
//                 await page.waitForLoadState("networkidle");
//                 await addNewBtn.first().click();
//                 continue;
//             }
//         }

//         // Wait a bit and retry
//         await page.waitForTimeout(2000);
//     }

//     throw new Error("Address form could not be opened");
// };


export const executePurchase = async (page, task, updateStatus = async () => { }) => {
    try {
        await updateStatus('Navigating to product page');
        await page.goto(`https://www.flipkart.com/product/p/itme?pid=${task.productlink}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        if (task.seller) {
            console.log("🟢 Seller:", task.seller);
            const FulfilledBy = page.getByText(/Fulfilled by/i);
            if (await FulfilledBy.count() > 0) {
                if (await FulfilledBy.first().isVisible()) {
                    await FulfilledBy.first().click();
                    await page.waitForTimeout(2000);

                    await page.getByText(/See other sellers/i).click();
                    await page.waitForTimeout(2000);
                    // 🎯 1️⃣ Exact seller name div
                    const sellerName = page.locator(
                        'div.b1jAQQ',
                        { hasText: new RegExp(`^${task.seller}$`, 'i') }
                    ).first();

                    await sellerName.waitFor({ state: "visible", timeout: 5000 });

                    // 🎯 2️⃣ Go to seller CARD (not QGdlvi here, mobile layout)
                    const sellerCard = sellerName.locator(
                        'xpath=ancestor::div[contains(@class,"eXlcRr")]'
                    );

                    // 🎯 3️⃣ Radio button inside this seller card
                    const radioBtn = sellerCard.locator('input[type="radio"]');

                    await radioBtn.waitFor({ state: "attached", timeout: 5000 });

                    // 🔥 Radio is readonly → click parent div
                    await radioBtn.evaluate(el => el.click());

                    console.log(`✅ Seller selected: ${task.seller}`);

                    await page.waitForTimeout(1000);

                    // 🎯 4️⃣ Click BACK arrow (top-left)
                    const backBtn = page.locator('img[src*="svg"]').first();
                    await backBtn.click();

                    console.log("🔙 Returned to product page with selected seller");
                }

            }

            const seeOtherSellers = page.getByText(/See other sellers/i)
            if (await seeOtherSellers.count() > 0) {
                await seeOtherSellers.click();
                await page.waitForTimeout(2000);
                // 🎯 STEP 1: Exact seller name span (no partial match)
                const sellerNameSpan = page.locator(
                    '.zCSLD9 span',
                    { hasText: new RegExp(`^${task.seller}$`, 'i') }
                ).first();

                await sellerNameSpan.waitFor({ state: "visible", timeout: 5000 });

                // 🎯 STEP 2: Lock to THIS seller row only
                const sellerRow = sellerNameSpan.locator('xpath=ancestor::div[contains(@class,"QGdlvi")]');

                // 🟠 STEP 3: Buy Now ONLY inside this row
                const buyNowBtn = sellerRow.locator('button', { hasText: /buy now/i });

                await buyNowBtn.waitFor({ state: "visible", timeout: 5000 });
                await buyNowBtn.click();

                console.log(`🟢 Buy Now clicked for seller: ${task.seller}`);
            }

        }


        // 1️⃣ Sold Out check
        await updateStatus('Checking stock availability');
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

        await updateStatus('Clicking Buy Now');
        await page.getByRole("button", { name: /buy now/i }).click();
        await page.waitForLoadState("networkidle");

        // 🔍 Detect Flipkart error
        await updateStatus('Checking for purchase errors');
        const purchaseError = await detectPurchaseError(page);
        if (purchaseError) {
            console.log("❌ Purchase blocked by Flipkart:", purchaseError);
            return {
                success: false,
                reason: purchaseError,
            };
        }



        await updateStatus('Opening address form');
        // await openAddressFormSafely(page, task.name);
        await page.waitForTimeout(5000);

        const addNewBtn = page.getByText(/add a new address/i);
        if (await addNewBtn.count() > 0 && await addNewBtn.first().isVisible()) {
            console.log("🟢 Clicking Add New Address");
            await addNewBtn.first().click();
            await page.waitForSelector('input[name="name"]', {
                state: "visible",
                timeout: 15000
            })
        } else {
            // CASE 3: Existing address selected → Change
            const deliveryBlock = page.locator('div', {
                hasText: 'Delivery Address',
            });


            if (await deliveryBlock.count() > 0) {
                const changeBtns = deliveryBlock.getByRole('button', { name: /^change$/i }).nth(1);

                await changeBtns.waitFor({ state: 'visible', timeout: 5000 });
                await changeBtns.click();
                await addNewBtn.waitFor({ state: 'visible', timeout: 5000 });
                await addNewBtn.click();
            }

        }

        await updateStatus('Filling address details');
        await page.waitForTimeout(5000);
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

        await page.waitForTimeout(2000);
        const nameField = page.locator('input[name="name"]')
        await nameField.click();
        await page.waitForTimeout(1000);
        await nameField.type(task.name, { delay: 100 });
        await page.waitForTimeout(5000);
        await updateStatus('Saving address');
        await page
            .getByRole("button", { name: /Save and Deliver Here/i })
            .click();
        await page.waitForLoadState("networkidle");

        await updateStatus('Continuing to payment');
        await page.getByRole("button", { name: /CONTINUE/i }).click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(5000);
        // 🔄 Accept terms (if shown)
        const acceptBtn = page.getByRole("button", { name: /accept & continue/i });
        if (await acceptBtn.count() > 0 && await acceptBtn.first().isVisible()) {
            await updateStatus('Accepting terms');
            await acceptBtn.first().click();
            await page.waitForLoadState("networkidle");
        }
        await page.waitForTimeout(5000);
        // 💰 COD CHECK STARTS HERE
        await updateStatus('Checking COD availability');
        const codOption = await page.getByText(/Cash on Delivery/i);
        // ❌ Case 1: COD option hi nahi
        if (await codOption.count() === 0) {
            console.log("❌ COD option not found");
            return { success: false, reason: "COD Not Available" };
        }
        // ❌ Case 2: COD option disabled
        if (!(await codOption.first().isEnabled())) {
            console.log("❌ COD option disabled");
            return { success: false, reason: "COD Not Available" };
        }
        // ❌ Case 3: COD not available message
        const codBlockedMsg = page.getByText(/cod.*not available|cash on delivery.*not available/i);
        if (await codBlockedMsg.count() > 0) {
            console.log("❌ COD not available message");
            return { success: false, reason: "COD Not Available" };
        }
        await page.waitForTimeout(3000);
        // ✅ COD available → select it
        await updateStatus('Selecting COD');
        await codOption.first().click();

        // 🛒 PLACE ORDER
        await updateStatus('Placing order');
        const placeOrderBtn = page.getByRole("button", { name: /place order/i });
        await placeOrderBtn.waitFor({ state: "visible", timeout: 15000 });
        await placeOrderBtn.click();
        await page.waitForLoadState("networkidle");

        const orderConfirm = page.getByRole("button", { name: /Confirm order/i });
        await orderConfirm.waitFor({ state: "visible", timeout: 15000 });
        await orderConfirm.click();
        await page.waitForLoadState("networkidle");
        console.log("✅ Order placed successfully");
        await page.waitForTimeout(3000);
        // Optional popup handling
        const denyBtn = page.getByRole("button", { name: /Deny/i });

        if (await denyBtn.count() > 0 && await denyBtn.first().isVisible()) {
            await updateStatus('Handling popups');
            await denyBtn.first().click();
        }

        await page.waitForTimeout(3000);
        // 📸 TAKE SCREENSHOT
        await updateStatus('Capturing success screenshot');
        const screenshotPath = `screenshots/${task._id}-order-success.png`;
        await page.screenshot({
            path: screenshotPath,
            fullPage: true,
        });
        console.log("📸 Screenshot saved at:", screenshotPath);

        const TrackOrder = page.getByText(/Track & manage order/i);
        await TrackOrder.waitFor({ state: "visible", timeout: 10000 });
        await TrackOrder.click();
        await page.waitForLoadState("networkidle");

        // 🔍 Order ID text element
        await updateStatus('Extracting Order ID');
        const orderIdLocator = page.getByText(/Order #/i).first();
        await orderIdLocator.waitFor({ state: "visible", timeout: 10000 });
        // 🧠 Extract text
        const orderIdText = (await orderIdLocator.innerText()).trim();
        console.log("✅ Raw Order Text:", orderIdText);
        // 🎯 Extract only Order ID
        const match = orderIdText.match(/Order\s*#\s*([A-Z0-9]+)/i);
        if (!match) {
            throw new Error("Order ID not found");
        }
        const orderId = match[1];
        console.log("🎉 Order ID Extracted:", orderId);
        return { success: true, reason: 'Order placed successfully via COD', orderId: orderId };
    } catch (error) {
        console.error('Purchase Error:', error.message);
        return { success: false, reason: error.message };
    }
};
