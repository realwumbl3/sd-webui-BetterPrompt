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

		this.nodefield = nodefield;
		html`
			<div class="Node" this="main">
				<div class="FloatingButtons">
					<div this="float_buttons">
						<label>add</label>
						<div class="Button" nodetype="text">textarea</div>
						<div class="Button" nodetype="tags">tags</div>
						<div class="Button" nodetype="break">break</div>
						<div class="Button" this=add_json>json</div>
						<div class="Button" nodetype="group">group</div>
					</div>
				</div>
				<div class="Controls">
					<div class="Button" this="remove">X</div>
					<div class="Button Mute" this="mute" title="Mute Node">${EyeIcon}</div>
					<div class="Button Json" this="copy_json" title="Copy Json to clipboard">{js}</div>
					<div class="Thumb" title="Drag to reorder, drop on nother node to insert"
						draggable=true
					>::::::</div>
				</div>
				<div class="NodeArea" this="nodearea"></div>
			</div>
		`.bind(this);

		this.add_json.addEventListener("click", () => {
			this.nodefield.loadNodes(
				prompt("Enter json"),
				this.nodefield.nodes.indexOf(this)
			);
		});

		this.float_buttons.addEventListener("click", async (e) => {
			const button = e.target.closest(".Button");
			if (!button) return;
			const node = await getNodeClass(button.getAttribute("nodetype"));
			const tags_node = new node(this.editor, this.nodefield, {});
			this.nodefield.insertNode(
				tags_node,
				Math.max(0, this.nodefield.nodes.indexOf(this))
			);
			this.nodefield.reflectNodes();
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
		});

		this.json = {
			hidden: false,
			weight: 1,
			...initialJson,
		};
		this.reflectJson();
	}

	moveNodefields(newNodefield, index) {
		this.nodefield.nodes.splice(this.nodefield.nodes.indexOf(this), 1);
		this.nodefield = newNodefield;
		this.nodefield.nodes.splice(index ?? this.nodefield.nodes.length, 0, this);
	}

	shiftSelf(direction) {
		this.nodefield.reorderNode(this, direction);
	}

	isMuted() {
		return this.json.hidden;
	}

	reflectJson() {
		this.main.style.opacity = this.json.hidden ? 0.5 : 1;
	}

	getJson() {
		return this.json;
	}

	assignJson(json) {
		Object.assign(this.json, json);
	}
}
