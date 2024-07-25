import zyX, { html, css } from "../zyX-es6.js";
import Node from "../node.js";

export default class BreakNode extends Node {
	constructor(editor, nodefield, initialJson) {
		super(editor, nodefield, {
			name: "Break Node",
			type: "break",
			value: "break",
			...initialJson,
		});

		html`
			<form class="Options" this="options" name="type">
				<label><input type="radio" name="type" value="break" />Break</label>
				<label><input type="radio" name="type" value="addcomm" />Common</label>
				<label><input type="radio" name="type" value="addrow" />Row</label>
				<label><input type="radio" name="type" value="addcol" />Col</label>
			</form>
		`
			.join(this)
			.appendTo(this.nodearea);

		this.options.addEventListener("change", () => {
			const value = this.options.querySelector("input:checked").value;
			this.assignJson({ value });
		});

		this.updateOptions();
	}

	updateOptions() {
		const value = this.getJson().value;
		this.options.querySelector(`input[value=${value}]`).checked = true;
	}

	toPrompt() {
		if (this.isMuted()) return false;
		const value = this.getJson().value;
		return `${value.toUpperCase()}\n`;
	}
}
