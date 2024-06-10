import zyX, { html, css } from './zyX-es6.js'
import observe from './observer.js'

console.log('[BetterPrompt] main.js loaded.')


observe(document.body, "#tabs", (tabs) => {
    console.log('#tabs', tabs)
    const txt2img_tab = tabs.querySelector('#tab_txt2img')
    const img2img_tab = tabs.querySelector('#tab_img2img')
    new Editor(txt2img_tab)
    new Editor(img2img_tab)
})


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
                    <div this=compose class="Compose">Compose</div>
                </div>
            </div>
        `
            .bind(this)
            .const()

        this.compose.addEventListener('click', this.composePrompt.bind(this))

        this.add_node.addEventListener('click', () => {
            const text_node = new TextNode(this, {})
            this.nodesfield.append(text_node.main)
            this.nodes.push(text_node)
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
    }

    loadJson(json) {
        this.nodesfield.innerHTML = ''
        this.nodes = []
        for (const node of json) {
            if (node.type === 'text') {
                const text_node = new TextNode(this, node)
                this.nodesfield.append(text_node.main)
                this.nodes.push(text_node)
            }
        }
        this.composePrompt()
    }

    removeNode(node) {
        this.nodesfield.removeChild(node.main)
        this.nodes = this.nodes.filter(n => n !== node)
        this.composePrompt()
    }

    composePrompt() {
        const prompt = this.nodes.map(node => node.toPrompt()).filter(Boolean).join(', ')
        this.textarea.value = prompt
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }))
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
            <div class="Controls">
                <div class=Button this="remove">X</div>
                <div class=Button this="mute">Mute</div>
            </div>
            <div class=NodeArea this=nodearea></div>
        </div>
        `.bind(this)

        this.remove.addEventListener('click', () => {
            this.editor.removeNode(this)
        })

        this.mute.addEventListener('click', () => {
            this.#json.hidden = !this.#json.hidden
            this.domEffect()
        })

        this.#json = {
            hidden: false,
            weight: 1,
            ...initialJson
        }

        this.domEffect()
    }

    isMuted() {
        return this.#json.hidden
    }

    domEffect() {
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
        return value.replace(/\n/g, ', ').replace(/,+/g, ',').replace(/  +/g, ' ')
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
        border-radius: 5px;
        display: flex;
        flex-direction: column;
        gap: 5px;

        & > .Node {
            border: 1px solid #ffffff40;
            padding: 2px;
            border-radius: 5px;
            display: flex;
            gap: 5px;
            height: min-content;

            & > .Controls {
                user-select: none;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                height: max-content;

                & > .Button {
                    font-size: 13px;
                    padding: 5px;
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
            }

        }

    }

    & .footer {
        display: flex;
        justify-content: space-between;
        padding: .5em;
    }   

}
`
