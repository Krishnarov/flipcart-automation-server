/**
 * Logs into Gmail using provided credentials.
 * @param {import('playwright').Page} page
 * @param {string} email
 */
export const loginToEmail = async (page, email) => {
    try {

        // 1) Inbox open + settle
        await page.goto("https://m.kuku.lu/recv.php", {
            waitUntil: "domcontentloaded",
        });

        await page.click("#image_reload");
        await page.waitForTimeout(10000);
        await page.locator('input[name="q"]').fill(email)
        await page.waitForTimeout(10000);
        await page.press('input[name="q"]', 'Enter')
        await page.waitForLoadState("networkidle")
        await page.click("#image_reload");
        await page.waitForTimeout(3000);
        await page.click("#image_reload");
        await page.waitForLoadState("networkidle")

        // 2️⃣ Wait for latest mail subject (bold one)
        const subjectLocator = page
            .locator('[id^="area_mail_title_"] b span')
            .first();

        await subjectLocator.waitFor({
            state: "visible",
            timeout: 30000,
        });

        // 3️⃣ Read subject
        const subjectText = (await subjectLocator.innerText()).trim();
        console.log("📩 Subject:", subjectText);

        // 4️⃣ Extract OTP (6 digits)
        const otpMatch = subjectText.match(/\b\d{4,6}\b/);
        if (!otpMatch) {
            throw new Error("OTP not found in email subject");
        }

        const otp = otpMatch[0];
        console.log("✅ OTP Found:", otp);
        return otp;
    } catch (error) {
        console.error('Email Login Error:', error.message);
        // Note: Google has strong bot detection. This is a basic flow.
        throw new Error('Email Login Failed');
    }
};
