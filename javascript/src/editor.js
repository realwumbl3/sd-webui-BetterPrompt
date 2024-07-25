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
							<div this="compose" class="Button Compose">Compose</div>
							<div this="add_node" class="Button">Add Node</div>
							<div this="add_tags" class="Button">Add Tags</div>
							<div this="add_break" class="Button">Add BREAK</div>
							<div this="add_group" class="Button">Add Group</div>
							<div this="fit_content" class="Button">Fit content</div>
							<div this="export" class="Button">Export</div>
							<div this="import" class="Button">Import</div>
							<div this="import_prompt" class="Button">from prompt</div>
							<div this="import_file" class="Button">from file</div>
						</div>
						<div class="rightSide"></div>
					</div>
				</div>
			</div>
		`
			.bind(this)
			.prependTo(this.tab.firstElementChild);

		this.add_node.addEventListener("click", async () => this.mainNodes.addByType("text"));
		this.add_break.addEventListener("click", async () =>
			this.mainNodes.addByType("break")
		);
		this.add_tags.addEventListener("click", async () => this.mainNodes.addByType("tags"));
		this.add_group.addEventListener("click", async () =>
			this.mainNodes.addByType("group")
		);

		this.export.addEventListener("click", () => {
			navigator.clipboard.writeText(JSON.stringify(this.mainNodes.culmJson(), null, 1));
		});

		this.fit_content.addEventListener("click", () => this.mainNodes.fitContent());
		this.compose.addEventListener("click", this.composePrompt.bind(this));

		this.import.addEventListener("click", () => {
			this.loadJson(prompt("Enter json"));
		});

		this.import_prompt.addEventListener("click", () =>
			this.loadJson(this.textarea.value)
		);

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

	recognizeData(data) {
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

	loadJson(json) {
		const recognizedData = this.recognizeData(json);
		recognizedData && this.mainNodes.loadJson(recognizedData);
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

function b64EncodeUnicode(str) {
	return btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
			return String.fromCharCode("0x" + p1);
		})
	);
}

function b64DecodeUnicode(str) {
	return decodeURIComponent(
		Array.prototype.map
			.call(atob(str), function (c) {
				return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
			})
			.join("")
	);
}
