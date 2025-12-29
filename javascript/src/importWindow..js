import zyX, { html } from "./zyX-es6.js";

import NodeField, { getNodeField } from "./nodefield.js";

import { recognizeData } from "./editor.js";

export default class JsonImportPrompt {
    constructor(editor, callback) {
        this.editor = editor;
        this.callback = callback;
        this.previewNodeField = new NodeField(this.editor);

        html`
            <div this=main class="JsonImportPrompt BetterPromptAssets" zyx-wheel="${e => e.stopPropagation()}">
                <div class="Buttons">
                    <div this=import class="Button" zyx-click="${this.import.bind(this)}">Import</div>
                    <div this=cancel class="Button" zyx-click="${this.cancel.bind(this)}">Cancel</div>
                </div>
                <input this=input class="Input" placeholder="Enter json here"></input>
                <div this=preview class="Preview">${this.previewNodeField}</div>
            </div>
        `.bind(this);

        this.input.addEventListener("input", this.onInput.bind(this));
    }

    focus() {
        this.input.focus();
        return this;
    }

    onInput() {
        const data = recognizeData(this.input.value);
        if (!data) return this.previewNodeField.clear();
        this.previewNodeField.loadJson(data);
    }

    import() {
        const data = this.previewNodeField.culmJson();
        this.callback(data);
        this.main.remove();
    }

    cancel() {
        this.main.remove();
        this.callback(null);
    }
}
