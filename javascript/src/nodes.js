import zyX, { html, css } from './zyX-es6.js'

import { Editor } from './main.js'

/**
* @typedef {Object} PromptNode
* @property {string} name
* @property {string} type
* @property {string} value
* @property {string} weight
* @property {boolean} hidden
*/

export class Node {
    /** @type {PromptNode} */
    #json = {}

    /**
    * @param {Editor} editor
    * @param {PromptNode} initialJson
    */
    constructor(editor, initialJson) {
        this.editor = editor

        html`
        <div class="Node" this="main">
            <div class=FlotingButtons>
                <div>
                    <div class=Button this=add_node>add node</div>
                    <div class=Button this=add_break>add break</div>
                </div>
            </div>
            <div class="Controls">
                <div class=Button this="remove">X</div>
                <div class="Button Mute" this="mute">${EyeIcon}</div>
                <div class="Sort">
                    <button this=up class=Button> ↑ </button>
                    <button this=down class=Button> ↓ </button>
                </div>
            </div>
            <div class=NodeArea this=nodearea></div>
        </div>
        `.bind(this)

        this.up.addEventListener('click', () => this.reorder(-1))
        this.down.addEventListener('click', () => this.reorder(1))

        this.add_node.addEventListener('click', () => {
            const node = new TextNode(this.editor, {})
            this.editor.insertNode(node, Math.max(0, this.editor.nodes.indexOf(this)))
            this.editor.reflectNodes()
        })

        this.add_break.addEventListener('click', () => {
            const node = new BreakNode(this.editor, {})
            this.editor.insertNode(node, Math.max(0, this.editor.nodes.indexOf(this)))
            this.editor.reflectNodes()
        })

        this.remove.addEventListener('click', () => this.editor.removeNode(this))

        this.mute.addEventListener('click', () => {
            this.#json.hidden = !this.#json.hidden
            this.reflectJson()
        })

        this.#json = {
            hidden: false,
            weight: 1,
            ...initialJson
        }
        this.reflectJson()
    }

    reorder(direction) {
        this.editor.reorderNode(this, direction)
    }

    isMuted() {
        return this.#json.hidden
    }

    reflectJson() {
        this.main.style.opacity = this.#json.hidden ? 0.5 : 1
    }

    getJson() {
        return this.#json
    }

    assignJson(json) {
        Object.assign(this.#json, json)
    }

}

export class TextNode extends Node {
    constructor(editor, initialJson) {
        super(editor, {
            name: 'Text Node',
            type: 'text',
            value: '',
            ...initialJson
        })

        const value = this.getJson().value
        html`
            <textarea class=BasicText this=textarea style="height: 42px;">${value}</textarea>
        `.bind(this).appendTo(this.nodearea)

        this.textarea.addEventListener('input', () => {
            this.assignJson({ value: this.textarea.value })
            this.resizeToFitScrollheight()
        })

        setTimeout(() => this.resizeToFitScrollheight(), 0)
    }

    resizeToFitScrollheight() {
        this.textarea.style.height = 'auto'
        const scrollHeight = Math.max(this.textarea.scrollHeight, 42);
        this.textarea.style.height = `${scrollHeight}px`
    }

    toPrompt() {
        if (this.isMuted()) return false
        const value = this.getJson().value
        return value.replace(/\n/g, ' ').replace(/,+/g, ',').replace(/  +/g, ' ')
    }
}

export class BreakNode extends Node {
    constructor(editor, initialJson) {
        super(editor, {
            name: 'Break Node',
            type: 'break',
            value: 'break',
            ...initialJson
        })

        html`
            <form class=Options this=options name=type>
                <label><input type=radio name=type value=break />Break</label>
                <label><input type=radio name=type value=addcomm />Common</label>
                <label><input type=radio name=type value=addrow />Row</label>
                <label><input type=radio name=type value=addcol />Col</label>
            </form>
        `.bind(this).appendTo(this.nodearea)

        this.options.addEventListener('change', () => {
            const value = this.options.querySelector('input:checked').value
            this.assignJson({ value })
        })

        this.updateOptions()
    }

    updateOptions() {
        const value = this.getJson().value
        this.options.querySelector(`input[value=${value}]`).checked = true
    }

    toPrompt() {
        if (this.isMuted()) return false
        const value = this.getJson().value
        return `${value.toUpperCase()}\n`
    }
}

function EyeIcon() {
    return html`<svg xmlns="http://www.w3.org/2000/svg" fill=white width="14" height="10" viewBox="0 0 24 24">
        <path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 
        8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 
        .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z"/>
    </svg>`
}
