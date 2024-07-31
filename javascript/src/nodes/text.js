import zyX, { html, css } from "../zyX-es6.js";
import Node from "../node.js";

export default class TextNode extends Node {
    constructor(editor, nodefield, initialJson) {
        super(editor, nodefield, {
            name: "Text Node",
            type: "text",
            value: "",
            ...initialJson,
        });

        const value = this.getJson().value;
        html`
            <textarea class="BasicText" this="textarea" style="height: 42px;">${value}</textarea>
        `
            .join(this)
            .appendTo(this.nodearea);

        this.textarea.addEventListener("input", () => {
            this.assignJson({ value: this.textarea.value });
            this.resizeToFitScrollheight();
            this.callModified();
        });

        setTimeout(() => this.resizeToFitScrollheight(), 1);
    }

    resizeToFitScrollheight() {
        this.textarea.style.height = "auto";
        const scrollHeight = Math.max(this.textarea.scrollHeight, 58);
        this.textarea.style.height = `${scrollHeight}px`;
    }

    toPrompt() {
        if (this.isMuted()) return false;
        const value = this.getJson().value;
        return value.replace(/\n/g, " ").replace(/,+/g, ",").replace(/  +/g, " ");
    }
}
