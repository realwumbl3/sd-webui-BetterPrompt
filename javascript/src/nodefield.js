import zyX, { html, ZyXArray } from "./zyX-es6.js";
import { getNodeClass } from "./node.js";
import { reorderElement } from "./util.js";

import LZString from "./LZString.js";

import {
	decode as keyDecodeObject,
	encode as keyEncodeObject,
} from "./keyIndexObject.js";

export default class NodeField {
	constructor(editor) {
		this.editor = editor;
		this.nodes = new ZyXArray();
		html`
			<div
				this="nodefield"
				class="NodeField"
				zyx-array="${{ zyxactive: this.nodes }}"
			></div>
		`.bind(this);
	}

	clear() {
		this.nodes.clear();
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

	async addByType(type) {
		const nodeConstructor = await getNodeClass(type);
		const break_node = new nodeConstructor(this.editor, this, {});
		this.insertNode(break_node);
	}

	async loadJson(json) {
		this.clear();
		await this.loadNodes(json);
	}

	async loadNodes(json, index) {
		const load = [];
		for (const node of this.recognizeData(json)) {
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

	reorderNode(node, direction) {
		reorderElement(this.nodes, node, direction);
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

	fitContent() {
		this.nodes.forEach((node) => node.fitContent?.());
	}
}
