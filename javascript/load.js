(async () => {
    try {
        await import("./src/main.js");
    } catch (error) {
        console.error("[Error importing src/main.js]", error);
    }
})();
