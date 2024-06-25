import zyX, { html, css } from './zyX-es6.js'

import Editor from './editor.js'
import { EyeIcon } from './assets.js'

/**
* @typedef {Object} PromptNode
* @property {string} name
* @property {string} type
* @property {string} value
* @property {string} weight
* @property {boolean} hidden
*/

/**
* @param {string} type
* @returns {Promise<typeof Node>}
*/

export async function getNodeClass(type) {
    const importPath = `./nodes/${type}.js`
    return import(importPath).then(module => module.default)
}

export default class Node {
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
                <div class=FloatingButtons>
                    <div this=float_buttons>
                        <label>add</label>
                        <div class=Button nodetype="text">node</div>
                        <div class=Button nodetype="tags">tags</div>
                        <div class=Button nodetype="break">break</div>
                    </div>
                </div>
                <div class="Controls">
                    <div class=Button this="remove">X</div>
                    <div class="Button Mute" this="mute">${EyeIcon}</div>
                    <div class="Sort FlexBreak">
                        <button this=down class=Button> ↓ </button>
                        <button this=up class=Button> ↑ </button>
                    </div>
                </div>
                <div class=NodeArea this=nodearea></div>
            </div>
        `.bind(this)

        this.up.addEventListener('click', () => this.reorder(-1))
        this.down.addEventListener('click', () => this.reorder(1))

        this.float_buttons.addEventListener('click', async (e) => {
            const button = e.target.closest('.Button')
            if (!button) return
            const node = await getNodeClass(button.getAttribute('nodetype'))
            const tags_node = new node(this.editor, {})
            this.editor.insertNode(tags_node, Math.max(0, this.editor.nodes.indexOf(this)))
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


css`

.FlexBreak {
    flex-basis: 100%;
    height: 0;
}

`