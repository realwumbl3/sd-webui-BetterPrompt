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

    removeTag(tag) {
        const previousTag = this.tags[this.tags.indexOf(tag) - 1]
        this.tags.remove(tag)
        tag.main.remove()
        setTimeout(() => previousTag?.focus(), 10)
    }

    addTag(tag) {
        const newTag = new Tag(this, tag)
        this.tags.push(newTag)
        return newTag
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

        this.input = new AutoFitInput()
        this.input.addEventListener('input', () => this.updateTag())
        this.input.addEventListener('keydown', (e) => {
            // if enter is pressed, add a new tag
            if (e.key === 'Enter') {
                this.tagNode.addTag('')
            }
            if (e.key === 'Backspace' && this.input.value() === '') {
                if (this.tagNode.tags.length > 1) this.removeTag()
            }
        })

        html`
            <div this=main class="Tag">
                ${this.input}
                <div class="Remove" this="remove">X</div>
            </div>
        `.bind(this)

        this.input.set(this.value)

        this.remove.addEventListener('click', () => this.removeTag())

    }

    focus() {
        this.input.focus()
    }

    removeTag() {
        this.tagNode.removeTag(this)
    }

    updateTag() {
        this.value = this.input.value()
    }

    onConnected() {
        this.input.updateWidth()
        this.input.focus()
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

    focus() {
        this.input.focus()
    }

    addEventListener(...args) {
        this.input.addEventListener(...args)
    }

    set(value) {
        this.input.value = value
    }

    value() {
        return this.input.value
    }

    updateWidth() {
        setTimeout(() => {
            this.span.textContent = this.input.value < 1 ? this.input.placeholder : this.input.value
            this.input.style.width = this.span.offsetWidth + 10 + 'px'
        }, 10)
    }
}