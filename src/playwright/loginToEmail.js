/**
 * Logs into Gmail using provided credentials.
 * @param {import('playwright').Page} page
 */
export const loginToEmail = async (page) => {
    try {

        // 1) Inbox open + settle
        await page.goto("https://mail.google.com/mail/u/0/#inbox");
        await page.waitForLoadState("domcontentloaded");
        await page.waitForSelector('[role="row"]', { timeout: 20000 });
        // const refreshButton = page.locator("div.G-Ni.J-J5-Ji");
        // await refreshButton.click();
        // await page.waitForTimeout(2000);
        // await refreshButton.click();
        await page.waitForTimeout(2000);
        const rows = page.getByRole("row", { name: /flipkart/i });
        await rows.first().waitFor({ timeout: 20000 });
        await rows.first().click();
        const subject = page.getByRole("heading", {
            name: /Flipkart Account /i,
        });
        await subject.waitFor({ timeout: 10000 });
        const subjectText = await subject.innerText();
        const otp = subjectText.match(/\b\d{6}\b/)?.[0] ?? null;
        return otp
    } catch (error) {
        console.error('Email Login Error:', error.message);
        // Note: Google has strong bot detection. This is a basic flow.
        throw new Error('Email Login Failed');
    }
};
