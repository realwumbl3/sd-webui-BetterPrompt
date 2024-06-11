document.addEventListener("DOMContentLoaded", async () => {
	try {
		await import(chrome.runtime.getURL("./javascript/src/main.js"));
	} catch (error) {
		console.error("[Error importing src/main.js]", error);
	}
});
