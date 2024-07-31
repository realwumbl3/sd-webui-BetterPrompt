import zyX, { html, css } from "./zyX-es6.js";

import Editor from "./editor.js";
import { EyeIcon } from "./assets.js";
import NodeField from "./nodefield.js";
/**
 * @typedef {Object} PromptNode
 * @property {string} name
 * @property {string} type
 * @property {string} value
 * @property {string} weight
 * @property {boolean} hidden
 */

/**
 * @param {string} type
 * @returns {Promise<typeof Node>}
 */

export async function getNodeClass(type) {
    const importPath = `./nodes/${type}.js`;
    return import(importPath).then((module) => module.default);
}

export default class Node {
    /**
     * @param {Editor} editor
     * @param {NodeField} nodefield
     * @param {PromptNode} initialJson
     */
    constructor(editor, nodefield, initialJson) {
        this.editor = editor;
        this.type = initialJson.type;
        this.modifiedCallbacks = [];

        this.nodefield = nodefield;

        this.tT = (tooltip) => editor.tT(tooltip, { ml: this.main });

        html`
            <div class="Node" this="main">
                <div class="Thumb" 
                    draggable=true
                    zyx-mouseenter="${() => editor.tT("Drag to reorder this node.", { ml: this.main })}"
                >::::::</div>
                <div this=floating_buttons class="FloatingButtons" zyx-mouseenter="${() => editor.tT("Add a node next to this node.", { ml: this.main })}">
                    <div>
                        <label>add</label>
                        <div class="Button" nodetype="tags" zyx-mouseenter="${() => this.tT("Add a tags node.")}">tags</div>
                        <div class="Button" nodetype="break"zyx-mouseenter="${() => this.tT("Add a break node.")}">break</div>
                        <div class="Button" nodetype="text" zyx-mouseenter="${() => this.tT("Add a text node.")}">textarea</div>
                        <div class="Button" nodetype="group" zyx-mouseenter="${() => this.tT("Add a group node.")}">group</div>
                        <div class="Button" this=add_json zyx-mouseenter="${() => this.tT("Insert json.")}">json</div>
                    </div>
                </div>
                <div class="Controls">
                    <div this=mute class="Button Mute"zyx-mouseenter="${() => this.tT("Mute this node.")}">${EyeIcon}<span class=mutelabel>muted</span></div>
                    <div this=remove class="Button" zyx-mouseenter="${() => this.tT("Remove this node.")}">X</div>
                    <div this=copy_json class="Button Json" zyx-mouseenter="${() => this.tT("Copy json of this node.")}">{ js }</div>
                </div>
                <div class="NodeArea" this="nodearea"></div>
            </div>
        `.bind(this);

        this.main.addEventListener("pointermove", (e) => {
            zyX(this).debounce("checkCursor", () => {
                const cursorIsInTopHalf = e.clientY < this.main.getBoundingClientRect().top + this.main.clientHeight / 2;
                this.floating_buttons.classList.toggle("Bottom", !cursorIsInTopHalf);
                const inAnotherNodeField = e.target.closest(".NodeField") !== this.nodefield.main;
                this.main.classList.toggle("CursorInNestedNodeField", inAnotherNodeField);
            }, 100);
        });

        this.add_json.addEventListener("click", () => {
            this.nodefield.loadNodes(
                prompt("Enter json"),
                this.nodefield.nodes.indexOf(this)
            );
        });

        this.floating_buttons.addEventListener("click", async (e) => {
            const button = e.target.closest(".Button");
            if (!button) return;
            const cursorIsInTopHalf = e.clientY < this.main.getBoundingClientRect().top + this.main.clientHeight / 2;
            const node = await getNodeClass(button.getAttribute("nodetype"));
            const tags_node = new node(this.editor, this.nodefield, {});
            this.nodefield.insertNode(
                tags_node,
                Math.max(0, this.nodefield.nodes.indexOf(this) + (cursorIsInTopHalf ? 0 : 1))
            );
        });

        this.copy_json.addEventListener("click", () => {
            navigator.clipboard.writeText(JSON.stringify([this.getJson()], null, 1));
        });

        this.remove.addEventListener("click", (e) => {
            if (e.shiftKey) {
                this.nodefield.removeNode(this);
            } else {
                const confirm = window.confirm("Are you sure you want to remove this node?, hold shift and click to remove node");
                if (confirm) {
                    this.nodefield.removeNode(this);
                }
            }
        });

        this.mute.addEventListener("click", () => {
            this.json.hidden = !this.json.hidden;
            this.reflectJson();
            this.callModified();
        });

        this.json = {
            hidden: false,
            weight: 1,
            ...initialJson,
        };
        this.reflectJson();
    }

    callModified() {
        this.nodefield.onModified();
    }

    moveNodefields(newNodefield) {
        this.nodefield.nodes.splice(this.nodefield.nodes.indexOf(this), 1);
        this.nodefield = newNodefield;
    }

    shiftSelf(direction) {
        this.nodefield.reorderNode(this, direction);
    }

    isMuted() {
        return this.json.hidden;
    }

    reflectJson() {
        this.main.classList.toggle("Muted", this.json.hidden);
    }

    getJson() {
        return this.json;
    }

    assignJson(json) {
        Object.assign(this.json, json);
    }
}
