import zyX, { html, css } from './zyX-es6.js'
import observe from './observer.js'

console.log('[BetterPrompt] main.js loaded!!!')
observe(document.body, "#tabs", (tabs) => {
    console.log('#tabs', tabs)
    new Editor(tabs, "txt2img")
    new Editor(tabs, "img2img")
})

if (chrome.runtime) css`@import url(${chrome.runtime.getURL('static/styles.css')});`
else css`@import url('BetterPrompt/static/styles.css');`

import { ResolutionPicker } from './resolutionPicker.js'
import { TextNode, BreakNode } from './nodes.js'

export class Editor {
    constructor(tabs, tabname) {
        this.tabs = tabs
        this.tabname = tabname
        this.tab = tabs.querySelector(`#tab_${this.tabname}`)
        if (!this.tab) return console.error(`Tab ${this.tabname} not found`)

        this.nodes = []
        this.textarea = this.tab.querySelector('textarea')

        html`
            <div class="BetterPromptContainer">
                <div this=main class="BetterPrompt">
                    <div class="Header">
                        <label class="title">BetterPrompt Editor</label>
                        <div class="RightSide">
                            <div this=export class="Button">Export Json</div>
                            <div this=import class="Button">Import Json</div>
                        </div>
                    </div>
                    <div this=nodesfield class="NodeFeild"></div>
                    <div class="EditorFooter">
                        <div class="leftSide">
                            <div this=add_node class="Button">Add Node</div>
                            <div this=add_break class="Button">Add BREAK</div>
                        </div>
                        <dev class="rightSide">
                            <div this=compose class="Button Compose">Compose</div>
                        </dev>
                    </div>
                </div>
            </div>
        `
            .bind(this)
            .prependTo(this.tab.firstElementChild)

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

        this.setUpSizeChangeListener()
        this.setupResolutionButtons()

        this.insertNode(new TextNode(this, {}))
        this.reflectNodes()
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

    reorderNode(node, direction) {
        this.nodes = reorderElement(this.nodes, node, direction)
        this.reflectNodes()
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

    setupResolutionButtons() {
        const widthInput = this.getSizeInput("width")
        const widthParent = widthInput.parentElement.parentElement
        this.resolutionPicker = new ResolutionPicker(widthParent, (width, height) => this.setWidthHeightParams(width, height))
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
        this.resolutionPicker.updateButtons(width, height);
    }
}

function reorderElement(array, element, offset) {
    const index = array.indexOf(element)
    const newIndex = Math.max(0, Math.min(array.length - 1, index + offset))
    array.splice(index, 1)
    array.splice(newIndex, 0, element)
    return array
}

function updateInput(input, value) {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
}
