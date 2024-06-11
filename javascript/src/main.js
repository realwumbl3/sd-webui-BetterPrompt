import zyX, { html, css } from './zyX-es6.js'
import observe from './observer.js'

console.log('[BetterPrompt] main.js loaded!!!')
observe(document.body, "#tabs", (tabs) => {
    console.log('#tabs', tabs)
    const txt2img_tab = tabs.querySelector('#tab_txt2img')
    const img2img_tab = tabs.querySelector('#tab_img2img')
    new Editor(txt2img_tab)
    new Editor(img2img_tab)
})

const resolutions = [
    [640, 1536, "9:21"],
    [768, 1344, "9:16"],
    [896, 1152, "3:4"],
    [1024, 1024, "1:1"],
    [1152, 896, "4:3"],
    [1344, 768, "16:9"],
    [1536, 640, "21:9"],
]

class Editor {
    constructor(tab) {
        this.tab = tab
        this.nodes = []
        this.textarea = this.tab.querySelector('textarea')

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
                    <div this=add_node class="Compose">Add Node</div>
                    <div this=add_break class="Compose">Add BREAK</div>
                    <div this=compose class="Compose">Compose</div>
                </div>
                <div this=presets class="footer">
                    ${resolutions.map(([w, h, t]) => html`<div class=Button resolution="${w}*${h}" title="${t}">${w}x${h}</div>`)}
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
            this.loadJson(JSON.parse(json))
        })

        tab.firstElementChild.prepend(this.main)

        this.presets.addEventListener('click', (e) => {
            const target = e.target.closest('[resolution]')
            if (!target) return
            const [width, height] = target.getAttribute('resolution').split('*')
            this.setGenWidthHeight(width, height)
        })

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
        this.nodes.splice(index || this.nodes.length, 0, node)
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

    setGenWidthHeight(width, height) {
        const controlls = this.tab.querySelectorAll(`#component-95 .form > div input[type="number"]`);
        const [widthInput, heightInput] = controlls;
        width !== undefined && updateInput(widthInput, width);
        height !== undefined && updateInput(heightInput, height);
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
                <div class=Button this=add_above>↑</div>
                <div class=Button this=add_below>↓</div>
            </div>
            <div class="Controls">
                <div class=Button this="remove">X</div>
                <div class=Button this="mute">Mute</div>
                <div class="Sort">
                    <button this=up class=Button>+</button>
                    <button this=down class=Button>+</button>
                </div>
            </div>
            <div class=NodeArea this=nodearea></div>
        </div>
        `.bind(this)

        this.up.addEventListener('click', () => this.reorder(-1))
        this.down.addEventListener('click', () => this.reorder(1))


        this.add_above.addEventListener('click', () => {
            const node = new TextNode(this.editor, {})
            this.editor.insertNode(node, this.editor.nodes.indexOf(this))
            this.editor.reflectNodes()
        })
        this.add_below.addEventListener('click', () => {
            const node = new TextNode(this.editor, {})
            this.editor.insertNode(node, this.editor.nodes.indexOf(this) + 1)
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
        this.editor.reflectJson()
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
        })
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

css`
.tabitem > .gap > .BetterPromptComposer {
    display: grid;
    gap: 5px;
    position: relative;
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 5px;
    padding: .5em;

    & .Button {
        padding: .5em;
        background: #4b5563;
        color: white;
        border-radius: 5px;
        cursor: pointer;
    }

    & .Header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #ffffff3d;
        padding: .5em;
        & .title {
            color: white;
        }
        & .RightSide {
            display: flex;
            gap: 5px;
        }
    }

    & .Compose {
        display: block;
        padding: .5em;
        background: #4b5563;
        color: white;
        border-radius: 5px;
        text-align: center;
        cursor: pointer;
    }

    & .NodeFeild {
        border: 1px solid #ffffff3d;
        padding: 5px;
        border-radius: 13px;
        display: flex;
        flex-direction: column;
        gap: 5px;

        & > .Node {
            border: 1px solid #ffffff40;
            padding: 2px;
            border-radius: 8px;
            display: flex;
            gap: 5px;
            height: min-content;
            margin-left: 10px;

            & .FlotingButtons {
                position: relative;
                width: 0;
                font-size: 8px;
                display: grid;
                align-content: space-between;
                height: 100%;
                left: -16px;
                & .Button {
                    padding: 3px;
                }
            }

            & > .Controls {
                user-select: none;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                height: max-content;

                & .Button {
                    font-size: 13px;
                    padding: 0 5px;
                    background: #4b5563;
                }
            }
            & > .NodeArea {
                flex-grow: 1;

                & > .BasicText {
                    background: unset;
                    border-radius: 5px;
                    min-height: 1em;
                    width: 100%;
                    color: white;
                }

                & > .Options {
                    display: flex;
                    gap: 5px;

                    & label {
                        display: flex;
                        gap: 5px;
                        align-items: center;
                    }

                    & input[type="radio"] {
                        background-color: #232739;
                        border-radius: 100%;
                    }

                }

            }

        }

    }

    & .footer {
        display: flex;
        padding: .5em;
        gap: 5px;
    }

}
`

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
