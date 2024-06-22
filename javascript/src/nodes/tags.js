import zyX, { html, css, ZyXDomArray, ZyXArray } from '../zyX-es6.js'
import Node from '../node.js'

export default class TagsNode extends Node {
    constructor(editor, initialJson) {
        super(editor, {
            name: 'Tags Node',
            type: 'tags',
            value: [],
            ...initialJson
        })

        this.tags = new ZyXArray()

        html`
            <div class="TagsNodeContainer">
                <div class=TagsNode this=tags_container zyx-array="${{ array: this.tags }}"></div>
                <button this=add_tag class=Button>+</button>
            </div>
        `.bind(this).appendTo(this.nodearea)

        this.add_tag.addEventListener('click', () => this.addTag(''))

        const value = super.getJson().value

        if (value) {
            for (const tag of value) {
                this.addTag(tag)
            }
        }
    }

    addTag(tag) {
        this.tags.push(new Tag(this, tag))
    }

    toPrompt() {
        if (this.isMuted()) return false
        const value = this.getJson().value
        return value.join(', ')
    }

    getJson() {
        return {
            ...super.getJson(),
            value: this.tags.map(tag => tag.value)
        }
    }

}


class Tag {
    constructor(tagNode, value) {
        this.tagNode = tagNode
        this.value = value

        this.autoFitInput = new AutoFitInput()

        html`
            <div this=main class="Tag">
                ${this.autoFitInput}
                <div class=Button this="remove">X</div>
            </div>
        `.bind(this)

        this.autoFitInput.input.value = this.value

        this.remove.addEventListener('click', () => this.removeTag())
        this.autoFitInput.input.addEventListener('input', () => this.updateTag())

        setTimeout(() => this.autoFitInput.updateWidth(), 100)

    }

    removeTag() {
        this.tagNode.tags.remove(this)
        this.main.remove()
    }

    updateTag() {
        this.value = this.autoFitInput.input.value
    }

}

class AutoFitInput {
    constructor({ placeholder = "enter tag" } = {}) {
        // put an invisible span in the input to measure the text width
        html`
            <div class=AutoFitInput>
                <input this=input type="text" placeholder="${placeholder}"/>
                <span this=span>${placeholder}</span>
            </div>
        `.bind(this)
        this.input.addEventListener('input', () => this.updateWidth())
    }
    updateWidth() {
        this.span.textContent = this.input.value < 1 ? this.input.placeholder : this.input.value
        this.input.style.width = this.span.offsetWidth + 10 + 'px'
    }
}
