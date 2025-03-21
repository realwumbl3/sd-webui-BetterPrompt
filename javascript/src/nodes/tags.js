import zyX, { html, ZyXArray, sleep } from "../zyX-es6.js";
import Node from "../node.js";
import AutoFitInput from "../autofitInput.js";

export default class TagsNode extends Node {
    constructor(editor, nodefield, initialJson) {
        super(editor, nodefield, {
            name: "Tags Node",
            type: "tags",
            value: [],
            ...initialJson,
        });

        this.tags = new ZyXArray();
        this.tags.addListener(this.tagsModified);

        html`
            <div class="TagsNodeContainer">
                <div
                    class="TagsNode"
                    this="tags_container"
                    zyx-array="${{ zyxactive: this.tags }}"
                ></div>
                <button this="add_tag" class="Button">+</button>
            </div>
        `
            .join(this)
            .appendTo(this.nodearea);

        this.add_tag.addEventListener("click", () => this.addTag(""));

        const value = super.getJson().value;
        if (value) {
            for (const tag of value) this.addTag(tag);
        }
    }

    tagsModified = (event, e) => {
        this.callModified();
    };

    removeTag(tag) {
        const previousTag = this.tags[this.tags.indexOf(tag) - 1];
        this.tags.remove(tag);
        tag.main.remove();
        setTimeout(() => previousTag?.focus(), 10);
    }

    addTag(tag) {
        if (typeof tag === "string") tag = { value: tag, weight: 1 };
        const newTag = new Tag(this, tag);
        this.tags.push(newTag);
        return newTag;
    }

    toPrompt() {
        if (this.isMuted()) return false;
        return this.tags.map((tag) => tag.toPrompt()).join(", ") + ", ";
    }

    getJson() {
        return {
            ...super.getJson(),
            value: this.tags.map((tag) => tag.jsonRepr()),
        };
    }
}

class Tag {
    constructor(tagNode, { value = "", weight = 1 } = {}) {
        this.tagNode = tagNode;

        this.value = value;
        this.weight = weight;

        this.input = new AutoFitInput();

        html`
            <div this="main" class="Tag">
                <div this="weight_indicator" class="Weight">${this.weight}</div>
                ${this.input}
                <div this="remove" class="Remove">X</div>
            </div>
        `.bind(this);

        this.input.addEventListener("input", () => this.updateTag());

        this.input.addEventListener("keydown", (e) => {
            if (!(e.key === "ArrowLeft" || e.key === "ArrowRight")) return;
            const initSel = this.input.selectionStart();
            this.input.addEventListener(
                "keyup",
                (e) => {
                    const upSel = this.input.selectionStart();
                    const inputLen = this.input.value().length;
                    if (e.key === "ArrowLeft" && upSel === 0 && initSel === 0) {
                        this.tagNode.tags[this.tagNode.tags.indexOf(this) - 1]?.focus();
                    }
                    if (e.key === "ArrowRight" && upSel === inputLen && initSel === inputLen) {
                        this.tagNode.tags[this.tagNode.tags.indexOf(this) + 1]?.focus();
                    }
                },
                { once: true }
            );
        });

        this.input.addEventListener("keyup", (e) => {
            if (e.key === "Enter") this.tagNode.addTag("");
            if (e.key === "Backspace" && this.input.value() === "") {
                if (this.tagNode.tags.length > 1) this.removeTag();
            }
            if (e.altKey && e.key === "ArrowUp") {
                this.weight = Math.min(1.7, Number((this.weight + 0.05).toFixed(2)));
                this.updateTag();
                e.preventDefault();
            }
            if (e.altKey && e.key === "ArrowDown") {
                this.weight = Math.max(-1.7, Number((this.weight - 0.05).toFixed(2)));
                this.updateTag();
                e.preventDefault();
            }
        });

        this.input.set(this.value);
        this.updateTag();

        this.remove.addEventListener("click", () => this.removeTag());
    }

    jsonRepr() {
        if (this.weight === 1) return this.value;
        return {
            value: this.value,
            weight: this.weight,
        };
    }

    toPrompt() {
        const value = this.value;
        if (value.startsWith("<") && value.endsWith(">")) return value;
        const underscored = value.replace(/ /g, "_");
        if (this.weight !== 1) return `(${underscored}:${this.weight})`;
        return underscored;
    }

    focus() {
        this.input.focus();
    }

    removeTag() {
        this.tagNode.removeTag(this);
    }

    updateTag() {
        this.tagNode.callModified();
        const input_value = this.input.value().trim();
        this.value = input_value;
        this.main.classList.toggle(
            "LORA",
            input_value.startsWith("<") && input_value.endsWith(">")
        );
        this.weight_indicator.textContent = this.weight;
        this.main.style.setProperty("--weight", this.weight);
        this.main.classList.toggle("Neutral", this.weight === 1);
        this.main.classList.toggle("Positive", this.weight > 1);
        this.main.classList.toggle("Negative", this.weight < 1);
    }

    async onConnected() {
        await sleep(0);
        this.input.focus();
    }
}
