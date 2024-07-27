import zyX, { html, sleep } from "./zyX-es6.js";
import { ResolutionPicker } from "./resolutionPicker.js";
import { getNodeClass } from "./node.js";
import { updateInput } from "./util.js";
import DenoiserControlExtender from "./denoiseExtension.js";

import NodeField from "./nodefield.js";

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

		html`
			<div class="BetterPromptContainer">
				<div this="main" class="BetterPrompt">
					<div class="Header">
						<label class="title">⠕ BetterPrompt Editor ⠪</label>
						<div class="RightSide">
							<div this="send_to_other" class="Button">
								Send to ${this.tabname === "txt2img" ? "img2img" : "txt2img"}
							</div>
						</div>
					</div>
					${this.mainNodes}
					<div class="EditorFooter">
						<div class="leftSide">
							<div this="compose" class="Button Compose">COMPOSE</div>
							<div this="add_textarea" class="Button" zyx-click="${_ => this.mainNodes.addByType("text")}">+ textarea</div>
							<div this="add_tags" class="Button" zyx-click="${_ => this.mainNodes.addByType("tags")}">+ tags</div>
							<div this="add_break" class="Button" zyx-click="${_ => this.mainNodes.addByType("break")}">+ BREAK</div>
							<div this="add_group" class="Button" zyx-click="${_ => this.mainNodes.addByType("group")}">+ group</div>
							<div this="import" class="Button">JSON</div>
							<div this="fit_content" class="Button">fit content</div>
							<div this="export" class="Button">export</div>
							<div this="import_file" class="Button">load file</div>
							${new ClearPrompt(this)}
						</div>
						<div class="rightSide"></div>
					</div>
				</div>
			</div>
		`
			.bind(this)
			.prependTo(this.tab.firstElementChild);

		this.export.addEventListener("click", () => {
			navigator.clipboard.writeText(JSON.stringify(this.mainNodes.culmJson(), null, 1));
		});

		this.fit_content.addEventListener("click", () => this.mainNodes.fitContent());
		this.compose.addEventListener("click", this.composePrompt.bind(this));

		this.import.addEventListener("click", () => {
			this.mainNodes.loadNodes(prompt("Enter json"));
		});

		this.import_file.addEventListener("click", () => this.openSelectFile());

		this.send_to_other.addEventListener("click", this.sendToOtherEditor.bind(this));

		this.asyncConstructor();
	}

	async asyncConstructor() {
		this.mainNodes.addByType("tags");
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
		await updateInput(this.textarea, `${prompt}\n\n<betterpromptexport:${lzString}>`);
		this.textarea.style.height = `${promptHeight}px`;
	}
}

class ClearPrompt {
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
