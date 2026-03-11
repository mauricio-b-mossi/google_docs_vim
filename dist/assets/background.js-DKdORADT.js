chrome.runtime.onInstalled.addListener(e=>{e.reason===chrome.runtime.OnInstalledReason.INSTALL&&chrome.tabs.create({url:"https://vimdocs.vercel.app/"})});
