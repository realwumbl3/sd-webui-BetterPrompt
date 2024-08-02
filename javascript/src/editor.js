import zyX, { html, sleep, getDomArray } from "./zyX-es6.js";
import { ResolutionPicker } from "./resolutionPicker.js";
import { getNodeClass } from "./node.js";
import { updateInput } from "./util.js";
import DenoiserControlExtender from "./denoiseExtension.js";

import NodeField, { getNodeField } from "./nodefield.js";

import LZString from "./LZString.js";

import {
    decode as keyDecodeObject,
    encode as keyEncodeObject,
} from "./keyIndexObject.js";

import Demo from "./demo.js";

class EditorButton {
    constructor(editor, { text, tooltip, click } = {}) {
        this.editor = editor;
        this.text = text;
        this.click = click;
        this.tooltip = tooltip || "";
        html`
            <div this=main class="Button" 
                zyx-click="${this.onClick.bind(this)}"
                zyx-mouseenter="${_ => editor.setHint(this.tooltip, { ml: this.main })}"
            >${this.text}</div>
        `.bind(this);
    }

    onClick() {
        this.click();
    }
}

class ClearPromptButton {
    /**
     * @param {Editor} editor    
     */
    constructor(editor) {
        html`
            <div this=main class="ClearPrompt Button" zyx-mouseenter="${_ => editor.setHint("Clear the prompt.", { ml: this.main })}">
                <div this=clear class="Button" zyx-click="${_ => this.main.classList.add("active")}">Clear</div>
                <div this=cancel class="Button Cancel" zyx-click="${_ => this.main.classList.remove("active")}">No</div>
                <div this=confirm class="Button Confirm" zyx-click="${_ => editor.mainNodes.clear() + this.main.classList.remove("active")}">Yes</div>
            </div>
        `.bind(this);
    }
}

class BetterPromptHintInfo {
    constructor(editor) {
        this.editor = editor;
        html`
            <div this=main class="BetterPromptHintInfo">    
                <div this=hint class="Hint"><span>|</span><span this=tooltip></span></div>
                <div this=info class="Info"></div>
            </div>                                        

        `.bind(this);
    }

    setHint(text, { ml, duration } = {}) {
        this.tooltip.innerText = text;
        zyX(this.tooltip).delay("tooltip", duration || 2000, () => { this.tooltip.innerText = "" });
        ml && ml.addEventListener("mouseleave", () => console.log("tooltip") || zyX(this.tooltip).instant("tooltip"), { once: true });
    }

}

class ComposeButton {
    constructor(editor) {
        this.editor = editor;
        html`
            <div this=main class="Compose" zyx-click="${() => this.editor.composePrompt()}"
                zyx-mouseenter="${_ => editor.setHint("Compose the prompt into the text area.", { ml: this.main })}"
            >COMPOSE</div>
        `.bind(this);
    }

    setModified(bool) {
        this.main.classList.toggle("Modified", bool);
    }
}

export default class Editor {
    constructor(editors, { tabNav, tabs }, tabname) {
        this.editors = editors;
        this.tabs = tabs;
        this.tabNav = tabNav;
        this.tabname = tabname;
        this.tab = tabs.querySelector(`#tab_${this.tabname}`);
        if (!this.tab) return console.error(`Tab ${this.tabname} not found`);

        this.resolutionPicker = new ResolutionPicker(this);
        this.textarea = this.tab.querySelector("textarea");
        if (this.tabname === "img2img") {
            this.setInpaintPaddingLimit(512);
            this.denoiserControlExtender = new DenoiserControlExtender(this);
        }

        this.mainNodes = new NodeField(this);

        this.dragState = {
            lastDragged: null,
            dragTarget: null,
        };

        this.BUTTONS = [{
            text: "export",
            tooltip: "Export the current prompt to your clipboard as json.",
            click: () => this.copyStateToClipboard() + this.setHint("Copied to clipboard."),
        }, {
            text: "import",
            tooltip: "Import a prompt using normal / encoded json.",
            click: () => this.loadJson(prompt("Enter json")),
        }, {
            text: "load file",
            tooltip: "Load a prompt from a stable-diffusion output file (exif metadata), or a json file.",
            click: this.openSelectFile.bind(this),
        }]

        this.composeButton = new ComposeButton(this);
        this.clearPromptButton = new ClearPromptButton(this);
        this.betterPromptHint = new BetterPromptHintInfo(this);
        this.setHint = this.betterPromptHint.setHint.bind(this.betterPromptHint);

        html`
            <div class="BetterPromptContainer">
                <div this="main" class="BetterPrompt">
                    <div class="Header">
                        <div class="LeftSide">
                            <label class="BetterPromptTitle">⠕ BetterPrompt Editor ⠪</label>
                            <a href="https://github.com/realwumbl3/sd-webui-BetterPrompt" target="_blank" class="Button">GitHub</a>
                        </div>
                        <div class="RightSide">
                            <div this="send_to_other" class="Button" zyx-click="${this.sendToOtherEditor.bind(this)}">
                                Send to ${this.tabname === "txt2img" ? "img2img" : "txt2img"}
                            </div>
                        </div>
                    </div>
                    <div this=main_editor class="MainEditor"
                        zyx-dragenter="${_ => this.dragEnter(_)}"
                        zyx-dragstart="${_ => this.dragStart(_)}"
                        zyx-dragend="${_ => this.dragEnd(_)}"
                        zyx-dragover="${_ => this.dragState.dragTarget && _.preventDefault()}"
                    >
                        ${this.mainNodes}
                    </div>
                    <div class="EditorFooter">
                        <div class="leftSide">
                            ${this.composeButton}
                            <div class="Column">
                                <div class="Row Status">
                                    <div class="Status">
                                        ${this.betterPromptHint}
                                    </div>
                                </div>
                                <div class="Row Manage">
                                    ${this.clearPromptButton}
                                    ${this.BUTTONS.map(button => new EditorButton(this, button))}
                                </div>
                            </div>
                        </div>
                        <div class="rightSide"></div>
                    </div>
                </div>
            </div>
        `
            .bind(this)
            .prependTo(this.tab.firstElementChild);

        this.mainNodes.addModifiedEventListener(() => this.onNodesModified());

        this.asyncConstructor();
    }

    tT(text, { ml, duration } = {}) {
        this.tooltip.innerText = text;
        zyX(this.tooltip).delay("tooltip", duration || 2000, () => { this.tooltip.innerText = "" });
        ml && ml.addEventListener("mouseleave", () => console.log("tooltip") || zyX(this.tooltip).instant("tooltip"), { once: true });
    }

    copyStateToClipboard() {
        navigator.clipboard.writeText(JSON.stringify(this.mainNodes.culmJson(), null, 1))
    }

    onNodesModified(event, e) {
        this.composeButton.setModified(true);
    }

    dragEnter(e) {
        if (!this.dragState.dragTarget) return true;
        e.preventDefault();
        const node = e.target.closest(".Node");
        if (!node || this.dragState.lastDragged === node) return;
        if (this.dragState.dragTarget.contains(node)) return highlightNode(this.dragState.dragTarget, "red");
        this.dragState.lastDragged = node;
        highlightNode(this.dragState.lastDragged);
    }

    dragStart(e) {
        if (!e.target?.matches(".Thumb")) return true;
        this.dragState.dragTarget = e.target.closest(".Node");
    }

    dragEnd(e) {
        if (!this.dragState.dragTarget) return true;
        e.preventDefault();
        if (!this.dragState.lastDragged) return this.dragReset();
        if (this.dragState.lastDragged !== this.dragState.dragTarget) this.dragReorder(e);
        this.dragReset();
    }

    dragReset() {
        this.dragState.lastDragged = null;
        this.dragState.dragTarget = null;
    }

    dragReorder(e) {
        const { lastDragged, dragTarget } = this.dragState;
        const draggedNodeField = getNodeField(dragTarget.closest(".NodeField"));
        const draggedDomArray = getDomArray(draggedNodeField.nodefield);
        const draggedNode = draggedDomArray.get(dragTarget);
        if (!draggedNode) return;
        const targetNodeField = getNodeField(lastDragged.closest(".NodeField"));
        const targetDomArray = getDomArray(targetNodeField.nodefield);
        const targetNode = targetDomArray.get(lastDragged);
        // console.log({ dragTarget, lastDragged, targetNode, draggedNode });
        if (targetNode.type === "group" && targetNode.field.nodes.length < 1) {
            draggedNode.moveNodefields(targetNode.field, 0);
            targetNode.field.insertNode(draggedNode, 0);
            return;
        }
        const heightHalf = lastDragged.offsetHeight / 2;
        const nodeFieldRect = lastDragged.getBoundingClientRect();
        const atBottomHalf = e.clientY - nodeFieldRect.top > heightHalf;
        draggedNode.moveNodefields(targetNodeField);
        const targetNodeIndex = targetNodeField.nodes.indexOf(targetNode)
        const newIndex = targetNodeIndex + (atBottomHalf ? 1 : 0)
        targetNodeField.insertNode(draggedNode, newIndex);
        // console.log({ lastDragged, targetNodeIndex, atBottomHalf, newIndex, nodes: [...targetNodeField.nodes] });
        // console.log({ resultingNodes: [...targetNodeField.nodes] });
    }

    async asyncConstructor() {
        this.mainNodes.addByType("tags", { value: [""] });
    }

    loadDemoState() {
        this.mainNodes.loadJson(Demo);
    }

    queryTab(cb) {
        return this.tab.querySelector(cb(this.tabname));
    }

    queryTabAll(cb) {
        return this.tab.querySelectorAll(cb(this.tabname));
    }

    async sendToOtherEditor() {
        const otherTab = this.tabname === "txt2img" ? "img2img" : "txt2img";
        this.clickTab(otherTab);
        await sleep(50);
        const otherEditor = this.editors[otherTab];
        await otherEditor.mainNodes.loadJson(this.mainNodes.culmJson());
    }

    clickTab(which) {
        const tabs = Object.fromEntries(
            [...this.tabNav.children].map((tab) => [tab.innerText, tab])
        );
        const tab = tabs[which];
        tab.click();
    }

    loadJson(json) {
        this.mainNodes.loadJson(json);
    }

    async openSelectFile() {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.addEventListener("change", async () => {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = async () => {
                const fileContent = reader.result?.replace(/\0/g, ""); // remove null bytes (jpeg exif)
                fileContent && this.loadJson(fileContent);
            };
            reader.readAsText(file);
            fileInput.remove();
        });
        fileInput.style.display = "none";
        document.body.appendChild(fileInput);
        fileInput.click();
    }

    async composePrompt() {
        this.composeButton.setModified(false);
        const prompt = this.mainNodes.composePrompt();
        const encodedPrompt = keyEncodeObject(this.mainNodes.culmJson());
        const promptJson = JSON.stringify(encodedPrompt, null);
        const lzString = LZString.compressToBase64(promptJson);
        await updateInput(this.textarea, prompt);
        const promptHeight = this.textarea.scrollHeight;
        await updateInput(this.textarea, `${prompt}\n\n\n\n\n<betterpromptexport:${lzString}>`);
        this.textarea.style.height = `${promptHeight}px`;
    }

    setInpaintPaddingLimit(limit) {
        const slidercontainer = this.queryTab(_ => `#${_}_inpaint_full_res_padding`);
        const inputs = slidercontainer.querySelectorAll("input");
        for (const input of inputs) {
            input.setAttribute("max", limit || 256);
        }
    }
}

export function recognizeData(data) {
    if (data.includes("<betterpromptexport:")) {
        const encoded64 = data.match(/<betterpromptexport:(.+)>/)[1];
        const decodedLora = LZString.decompressFromBase64(encoded64);
        const parsedLora = JSON.parse(decodedLora);
        data = keyDecodeObject(parsedLora);
    }
    if (typeof data === "string") data = JSON.parse(data);
    if (!Array.isArray(data)) return null;
    return data;
}

function highlightNode(node, color) {
    node.classList.add("highlighted"); node.style.setProperty("--highlight-color", color || "orange");
    zyX(node).delay("highlight", 300, () => { node.classList.remove("highlighted"); node.style.removeProperty("--highlight-color") });
}