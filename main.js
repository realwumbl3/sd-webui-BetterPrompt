document.addEventListener("DOMContentLoaded", async () => {
	try {
		await import(chrome.runtime.getURL("./src/main.js"));
	} catch (error) {
		console.error("[Error importing src/main.js]", error);
	}
});
