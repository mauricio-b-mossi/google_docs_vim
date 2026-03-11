// background.js

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // Open the external onboarding website when the extension is first installed
        chrome.tabs.create({
            url: "https://vimdocs.vercel.app/"
        });
    }
});
