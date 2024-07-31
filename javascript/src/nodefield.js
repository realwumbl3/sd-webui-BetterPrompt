import zyX, { html, ZyXArray, getDomArray, WeakRefSet } from "./zyX-es6.js";
import { getNodeClass } from "./node.js";
import { shiftArrayElement } from "./util.js";
import { recognizeData } from "./editor.js";

import LZString from "./LZString.js";

import {
    decode as keyDecodeObject,
    encode as keyEncodeObject,
} from "./keyIndexObject.js";

const fields = new WeakRefSet();

/**
 * 
 * @param {HTMLElement} nodefield 
 * @returns {NodeField}
 */
export function getNodeField(nodefield) {
    return fields.get().find(_ => _.main === nodefield);
}

export default class NodeField {
    constructor(editor) {
        fields.add(this);
        this.editor = editor;
        this.nodes = new ZyXArray();
        html`
            <div this=main class="NodeField">
                <div
                    this="nodefield"
                    class="NodeFieldList"
                    zyx-array="${{ zyxactive: this.nodes }}"
                ></div>
                <div class="AddNodes">
                    <div class="Button" zyx-click="${() => this.addByType("tags")}">+ tags</div>
                    <div class="Button" zyx-click="${() => this.addByType("text")}">+ textarea</div>
                    <div class="Button" zyx-click="${() => this.addByType("break")}">+ BREAK</div>
                    <div class="Button" zyx-click="${() => this.addByType("group")}">+ group</div>
                    <div class="Button" zyx-click="${() => this.loadNodes(prompt("Enter json"))}">+ JSON</div>
                </div>
            </div>
        `.bind(this);
        this.callbacks = [];
        this.nodes.addListener(this.nodeArrayModified);
    }

    nodeArrayModified = (event, e) => {
        this.main.classList.toggle("Empty", this.nodes.length === 0);
        this.onModified();
    }

    addModifiedEventListener(callback) {
        this.callbacks.push(callback);
    }

    onModified() {
        for (const cb of this.callbacks) {
            cb();
        }
    }

    clear() {
        this.nodes.clear();
    }

    async addByType(type, initialData, index) {
        const nodeConstructor = await getNodeClass(type);
        const break_node = new nodeConstructor(this.editor, this, initialData || {});
        this.insertNode(break_node, index);
    }

    async loadJson(json) {
        if (!json) return;
        this.clear();
        await this.loadNodes(json);
    }

    async loadNodes(json, index) {
        const load = [];
        for (const node of recognizeData(json)) {
            const { type } = node;
            const nodeConstructor = await getNodeClass(type);
            load.push(new nodeConstructor(this.editor, this, node));
        }
        this.nodes.splice(index || this.nodes.length, 0, ...load);
    }

    culmJson() {
        return this.nodes.map((node) => node.getJson());
    }

    insertNode(node, index) {
        this.nodes.splice(index ?? this.nodes.length, 0, node);
    }

    shiftNode(node, direction) {
        shiftArrayElement(this.nodes, node, direction);
    }

    removeNode(node) {
        this.nodes.splice(this.nodes.indexOf(node), 1);
    }

    composePrompt() {
        const prompt = this.nodes
            .map((node) => node.toPrompt())
            .filter(Boolean)
            .join(" ");
        return prompt;
    }

}
