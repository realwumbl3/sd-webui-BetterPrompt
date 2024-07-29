import zyX, { html, css } from "zyX";

css`
    .TabletMode {
        min-width: min(0px, 100%);
        position: fixed;
        top: 30vh;
        height: 70vh;
        overflow: hidden;
        width: 100vw;
        left: 0;
        z-index: 1000000;
    }
`;

export default class TabletMode {
    constructor() {
        html`
            <div this="main" class="TabletMode">
                <div this="betterprompt" class="BetterPromptContainer"></div>
                <div this="canvas_container" class="CanvasContainer"></div>
            </div>
        `
            .bind(this)
            .appendTo(document.body);
    }

    show() {
        this.canvas_container.innerHTML = "";
        this.canvas_container.style.display = "block";
    }

    hide() {
        this.canvas_container.style.display = "none";
    }
}
