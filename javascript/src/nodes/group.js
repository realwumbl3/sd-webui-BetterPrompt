import zyX, { html, css } from "../zyX-es6.js";
import Node from "../node.js";

import NodeField from "../nodefield.js";

export default class GroupNode extends Node {
    constructor(editor, nodefield, initialJson) {
        super(editor, nodefield, {
            name: "Group Node",
            type: "group",
            value: [],
            ...initialJson,
        });

        this.field = new NodeField(editor);

        this.field.addModifiedEventListener(() => this.callModified());

        html`
            <div class="Group" this="options">
                ${this.field}
            </div>
        `
            .join(this)
            .appendTo(this.nodearea);

        const value = super.getJson().value;
        if (value) {
            this.field.loadJson(value);
        }
    }

    getJson() {
        return {
            ...super.getJson(),
            value: this.field.culmJson(),
        };
    }

    toPrompt() {
        if (this.isMuted()) return false;
        return this.field.composePrompt();
    }
}
