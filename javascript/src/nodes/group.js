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

		html`
			<div class="Group" this="options">
				${this.field}
				<div class="AddNode">
					<div class="Button" this="add_node">+ node</div>
					<div class="Button" this="add_tags">+ tags</div>
					<div class="Button" this="add_break">+ BREAK</div>
					<div class="Button" this="add_group">+ group</div>
					<div class="Button" this="add_json">+ JSON</div>
				</div>
			</div>
		`
			.join(this)
			.appendTo(this.nodearea);

		this.add_group.addEventListener("click", async () => this.field.addByType("group"));
		this.add_node.addEventListener("click", async () => this.field.addByType("text"));
		this.add_break.addEventListener("click", async () => this.field.addByType("break"));
		this.add_tags.addEventListener("click", async () => this.field.addByType("tags"));

		this.add_json.addEventListener("click", async () =>
			this.field.loadNodes(prompt("Enter Json"))
		);

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
