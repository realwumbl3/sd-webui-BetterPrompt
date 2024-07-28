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
					<div class="Button" this="add_node" zyx-click="${_ => this.field.addByType("text")}">+ textarea</div>
					<div class="Button" this="add_tags" zyx-click="${_ => this.field.addByType("tags")}">+ tags</div>
					<div class="Button" this="add_break" zyx-click="${_ => this.field.addByType("break")}">+ BREAK</div>
					<div class="Button" this="add_json" zyx-click="${_ => this.field.loadNodes(prompt("Enter Json"))}">+ JSON</div>
					<div class="Button" this="add_group" zyx-click="${_ => this.field.addByType("group")}">+ group</div>
				</div>
			</div>
		`
			.join(this)
			.appendTo(this.nodearea);

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
