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
			this.denoiserControlExtender = new DenoiserControlExtender(this);
		}

		this.mainNodes = new NodeField(this);

		this.dragState = {
			lastDragged: null,
			dragTarget: null,
		};

		html`
			<div class="BetterPromptContainer">
				<div this="main" class="BetterPrompt">
					<div class="Header">
						<label class="BetterPromptTitle">⠕ BetterPrompt Editor ⠪</label>
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
						zyx-dragover="${_ => _.preventDefault()}"
					>${this.mainNodes}</div>
					<div class="EditorFooter">
						<div class="leftSide">
							<div this="compose" class="Button Compose" zyx-click="${this.composePrompt.bind(this)}">COMPOSE</div>
							<div this="add_textarea" class="Button" zyx-click="${() => this.mainNodes.addByType("text")}">+ textarea</div>
							<div this="add_tags" class="Button" zyx-click="${() => this.mainNodes.addByType("tags")}">+ tags</div>
							<div this="add_break" class="Button" zyx-click="${() => this.mainNodes.addByType("break")}">+ BREAK</div>
							<div this="import" class="Button" zyx-click="${() => this.mainNodes.loadNodes(prompt("Enter json"))}">+ JSON</div>
							<div this="add_group" class="Button" zyx-click="${() => this.mainNodes.addByType("group")}">+ group</div>
							<div this="export" class="Button" zyx-click="${this.copyStateToClipboard.bind(this)}">export</div>
							<div this="import_file" class="Button" zyx-click="${this.openSelectFile.bind(this)}">load file</div>
							${new ClearPromptButton(this)}
						</div>
						<div class="rightSide"></div>
					</div>
				</div>
			</div>
		`
			.bind(this)
			.prependTo(this.tab.firstElementChild);

		this.asyncConstructor();
	}

	copyStateToClipboard() {
		navigator.clipboard.writeText(JSON.stringify(this.mainNodes.culmJson(), null, 1))
	}

	dragEnter(e) {
		e.preventDefault();
		const node = e.target.closest(".Node");
		if (!node || this.dragState.lastDragged === node) return;
		if (this.dragState.dragTarget.contains(node)) return highlightNode(this.dragState.dragTarget, "red");
		this.dragState.lastDragged = node;
		highlightNode(this.dragState.lastDragged);
	}

	dragStart(e) {
		this.dragState.dragTarget = e.target.closest(".Node");
	}

	dragEnd(e) {
		e.preventDefault();
		if (!this.dragState.lastDragged) return;
		if (this.dragState.lastDragged !== this.dragState.dragTarget) this.dragReorder();
		this.dragState.lastDragged = null;
		this.dragState.dragTarget = null;
	}

	dragReorder() {
		const draggedNodeField = getNodeField(this.dragState.dragTarget.closest(".NodeField"));
		const draggedDomArray = getDomArray(draggedNodeField.nodefield);
		const draggedItem = draggedDomArray.get(this.dragState.dragTarget);
		if (!draggedItem) return;
		const targetNodeField = getNodeField(this.dragState.lastDragged.closest(".NodeField"));
		const targetDomArray = getDomArray(targetNodeField.nodefield);
		const targetNode = targetDomArray.get(this.dragState.lastDragged);
		if (targetNode.type === "group" && targetNode.field.nodes.length < 1) {
			draggedItem.moveNodefields(targetNode.field, 0);
			return;
		}
		const indexInOwnField = targetNodeField.nodes.indexOf(targetNode);
		draggedItem.moveNodefields(targetNodeField, indexInOwnField);
	}

	async asyncConstructor() {
		// this.mainNodes.addByType("tags");
		this.mainNodes.loadJson([
			{ type: "text", value: "Welcome to BetterPrompt Editor" },
			{ type: "tags", value: ["tags", "are", "cool"] },
			{ type: "break", value: "break" },
			{
				type: "group", value: [
					{ type: "text", value: "This is a group" },
					{ type: "tags", value: ["tags", "are", "cool"] },
					{ type: "break", value: "break" },
				]
			}
		])
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
				const json = reader.result;
				this.loadJson(json);
			};
			reader.readAsText(file);
			fileInput.remove();
		});
		fileInput.style.display = "none";
		document.body.appendChild(fileInput);
		fileInput.click();
	}

	async composePrompt() {
		const prompt = this.mainNodes.composePrompt();
		const encodedPrompt = keyEncodeObject(this.mainNodes.culmJson());
		let promptJson = JSON.stringify(encodedPrompt, null);
		const lzString = LZString.compressToBase64(promptJson);
		await updateInput(this.textarea, prompt);
		const promptHeight = this.textarea.scrollHeight;
		await updateInput(this.textarea, `${prompt}\n\n\n\n\n<betterpromptexport:${lzString}>`);
		this.textarea.style.height = `${promptHeight}px`;
	}
}

class ClearPromptButton {
	/**
	 * @param {Editor} editor	
	 */
	constructor(editor) {
		html`
				<div this=main class="ClearPrompt Button">
					<div this=clear class="Button">clear prompt</div>
					<div this=cancel class="Button Cancel">No</div>
					<div this=confirm class="Button Confirm">Yes</div>
				</div>
			`.bind(this).with(({ main, clear, confirm, cancel } = {}) => {
			clear.addEventListener("click", () => { main.classList.add("active") });
			confirm.addEventListener("click", () => { editor.mainNodes.clear(); main.classList.remove("active") });
			cancel.addEventListener("click", () => { main.classList.remove("active") });
		});
	}
}

function highlightNode(node, color) {
	node.classList.add("highlighted"); node.style.setProperty("--highlight-color", color || "orange");
	zyX(node).delay("highlight", 300, () => { node.classList.remove("highlighted"); node.style.removeProperty("--highlight-color") });
}