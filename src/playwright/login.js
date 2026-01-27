import { delay } from './utils.js';

/**
 * Logs into Flipkart using provided credentials.
 * @param {import('playwright').Page} page
 * @param {string} username
 * @param {string} password
 */
export const loginToFlipkart = async (page, username) => {
    try {
        await page.goto('https://www.flipkart.com/account/login', { waitUntil: 'networkidle' });

        await page.fill("input.c3Bd2c.yXUQVt", username);
        await delay(1000);
        await page.getByRole("button", { name: /Request OTP/i }).click();
        // await page.waitForNavigation({ waitUntil: 'networkidle' });




    } catch (error) {
        console.error('Login Error:', error.message);
        throw new Error('Login Failed');
    }
};
export const loginToFlipkartWithOTP = async (page, otp) => {
    try {
        // 1) All single-digit OTP inputs
        await page.waitForSelector('input[maxlength="1"]', {
            timeout: 30000,
        });

        const inputs = page.locator('input[maxlength="1"]');
        // 2) Safety check

        const count = await inputs.count();
        console.log(count);
        if (count < otp.length) {
            throw new Error(
                `OTP inputs (${count}) less than OTP length (${otp.length})`,
            );
        }
        const digits = otp.split("");
        for (let i = 0; i < digits.length; i++) {
            await inputs.nth(i).fill(digits[i]);
        }

    } catch (error) {
        console.error('Login Error:', error.message);
        throw new Error('Login Failed');
    }
};
