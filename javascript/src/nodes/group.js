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
					<div class="Button" this="add_node">Add Node</div>
					<div class="Button" this="add_tags">Add Tags</div>
					<div class="Button" this="add_break">Add BREAK</div>
				</div>
			</div>
		`
			.join(this)
			.appendTo(this.nodearea);

		this.add_node.addEventListener("click", async () => this.field.addByType("text"));
		this.add_break.addEventListener("click", async () => this.field.addByType("break"));
		this.add_tags.addEventListener("click", async () => this.field.addByType("tags"));

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
