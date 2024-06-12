import zyX, { html, css } from './zyX-es6.js'
import observe from './observer.js'

console.log('[BetterPrompt] main.js loaded!!!')
observe(document.body, "#tabs", (tabs) => {
    console.log('#tabs', tabs)
    new Editor(tabs, "txt2img")
    new Editor(tabs, "img2img")
})

import "./css.js"

class Editor {
    constructor(tabs, tabname) {
        this.tabs = tabs
        this.tabname = tabname
        this.tab = tabs.querySelector(`#tab_${this.tabname}`)
        if (!this.tab) return console.error(`Tab ${this.tabname} not found`)

        this.nodes = []
        this.textarea = this.tab.querySelector('textarea')
        this.textareacontent = ""
        this.resolutionButtons = resolutions.map(([w, h, t]) => new ResolutionButton(w, h, t))

        html`
            <div this=main class="BetterPromptComposer">
                <div class="Header">
                    <label class="title">BetterPrompt Editor</label>
                    <div class="RightSide">
                        <div this=export class="Button">Export Json</div>
                        <div this=import class="Button">Import Json</div>
                    </div>
                </div>
                <div this=nodesfield class="NodeFeild"></div>
                <div class="footer">
                    <div this=add_node class="Button">Add Node</div>
                    <div this=add_break class="Button">Add BREAK</div>
                    <div this=compose class="Button">Compose</div>
                </div>
                <div this=presets class="footer">
                    ${this.resolutionButtons}
                </div>
            </div>
        `
            .bind(this)

        this.compose.addEventListener('click', this.composePrompt.bind(this))

        this.add_node.addEventListener('click', () => {
            const text_node = new TextNode(this, {})
            this.insertNode(text_node)
            this.reflectNodes()
        })

        this.add_break.addEventListener('click', () => {
            const break_node = new BreakNode(this, {})
            this.insertNode(break_node)
            this.reflectNodes()
        })

        this.export.addEventListener('click', () => {
            const json = this.nodes.map(node => node.getJson())
            navigator.clipboard.writeText(JSON.stringify(json, null, 4))
        })

        this.import.addEventListener('click', () => {
            const json = prompt('Enter json')
            if (!json) return
            const parsed = JSON.parse(json)
            if (!Array.isArray(parsed)) return
            this.loadJson(parsed)
        })

        this.tab.firstElementChild.prepend(this.main)

        this.presets.addEventListener('click', (e) => {
            const target = e.target.closest('[resolution]')
            if (!target) return
            const [width, height] = target.getAttribute('resolution').split('*')
            this.setWidthHeightParams(width, height)
        })

        this.insertNode(new TextNode(this, {}))
        this.reflectNodes()
        this.setUpSizeChangeListener()
    }

    loadJson(json) {
        this.nodes = [];
        this.loadNodes(json)
        this.reflectNodes()
        this.composePrompt()
    }

    loadNodes(json) {
        for (const node of json) {
            const { type } = node
            const newNode = type === 'text' ? new TextNode(this, node) : new BreakNode(this, node)
            this.nodes.push(newNode)
        }
    }

    reflectNodes() {
        this.nodesfield.innerHTML = ''
        this.nodes.forEach(node => this.nodesfield.append(node.main))
    }

    insertNode(node, index) {
        this.nodes.splice(index ?? this.nodes.length, 0, node)
    }

    removeNode(node) {
        this.nodesfield.removeChild(node.main)
        this.nodes = this.nodes.filter(n => n !== node)
        this.composePrompt()
    }

    composePrompt() {
        const prompt = this.nodes.map(node => node.toPrompt()).filter(Boolean).join(' ')
        updateInput(this.textarea, prompt)
    }

    getSizeInput(axis) {
        return this.tab.querySelector(`#${this.tabname}_${axis} input[type="number"]`);
    }

    getSizeSliders(axis) {
        return this.tab.querySelector(`#${this.tabname}_${axis} input[type="range"]`);
    }

    getSizeParams() {
        return ["width", "height"].map(axis => Number(this.getSizeInput(axis).value));
    }

    setWidthHeightParams(width, height) {
        width !== undefined && updateInput(this.getSizeInput("width"), width);
        height !== undefined && updateInput(this.getSizeInput("height"), height);
    }

    setUpSizeChangeListener() {
        const [width, height] = ["width", "height"].map(axis => this.getSizeInput(axis));
        const [widthSlider, heightSlider] = ["width", "height"].map(axis => this.getSizeSliders(axis));
        [width, height, widthSlider, heightSlider].forEach(input => input.addEventListener("input", this.sizeChangeHandler.bind(this)));
    }

    sizeChangeHandler() {
        const [width, height] = this.getSizeParams();
        this.resolutionButtons.forEach(button => button.reflectMatch(width, height));
    }
}

/**
* @typedef {Object} PromptNode
* @property {string} name
* @property {string} type
* @property {string} value
* @property {string} weight
* @property {boolean} hidden
*/

class Node {
    /** @type {PromptNode} */
    #json = {}

    /**
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
                <div class=Button this="mute">Mute</div>
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
        this.editor.nodes = reorderElement(this.editor.nodes, this, direction)
        this.editor.reflectNodes()
    }

    isMuted() {
        return this.#json.hidden
    }

    reflectJson() {
        this.mute.textContent = this.#json.hidden ? 'Unmute' : 'Mute'
        this.main.style.opacity = this.#json.hidden ? 0.5 : 1
    }

    getJson() {
        return this.#json
    }

    assignJson(json) {
        Object.assign(this.#json, json)
    }

}

class TextNode extends Node {
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
        this.textarea.style.height = `${this.textarea.scrollHeight}px`
    }

    toPrompt() {
        if (this.isMuted()) return false
        const value = this.getJson().value
        return value.replace(/\n/g, ' ').replace(/,+/g, ',').replace(/  +/g, ' ')
    }
}

class BreakNode extends Node {
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

const resolutions = [
    [640, 1536, "9:21"],
    [768, 1344, "9:16"],
    [896, 1152, "3:4"],
    [1024, 1024, "1:1"],
    [1152, 896, "4:3"],
    [1344, 768, "16:9"],
    [1536, 640, "21:9"],
    [1280, 1280, "1:1"],
    [1440, 1440, "1:1"],
    [1600, 1600, "1:1"],
]

class ResolutionButton {
    constructor(w, h, t) {
        this.res = [w, h]
        html`<div this=main class="Button Resolution" resolution="${w}*${h}" title="${t}">${w}x${h}</div>`.bind(this)
    }

    matches(w, h) {
        return this.res[0] === w && this.res[1] === h
    }

    reflectMatch(w, h) {
        this.main.classList.toggle('active', this.matches(w, h))
    }
}

function reorderElement(array, element, offset) {
    const index = array.indexOf(element)
    const newIndex = index + offset
    if (newIndex < 0 || newIndex >= array.length) return array
    const newArray = [...array]
    newArray.splice(index, 1)
    newArray.splice(newIndex, 0, element)
    return newArray
}

function updateInput(input, value) {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
}
