export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForElement = async (page, selector, timeout = 10000) => {
    await page.waitForSelector(selector, { timeout });
};

export const clickIfVisible = async (page, selector) => {
    const element = await page.$(selector);
    if (element) {
        await element.click();
        return true;
    }
    return false;
};
