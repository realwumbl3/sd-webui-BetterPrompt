import zyX, { html, css, sleep } from './zyX-es6.js'
import { ResolutionPicker } from './resolutionPicker.js'
import { getNodeClass } from './node.js'
import { reorderElement, updateInput } from './util.js'
import DenoiserControlExtender from './denoiseExtension.js'
import observe from './observer.js'

export default class Editor {
    constructor(editors, { tabNav, tabs }, tabname) {
        this.editors = editors
        this.tabs = tabs
        this.tabNav = tabNav
        this.tabname = tabname
        this.tab = tabs.querySelector(`#tab_${this.tabname}`)
        if (!this.tab) return console.error(`Tab ${this.tabname} not found`)

        this.resolutionPicker = new ResolutionPicker(this)
        this.nodes = []
        this.textarea = this.tab.querySelector('textarea')
        if (this.tabname === "img2img") {
            this.denoiserControlExtender = new DenoiserControlExtender(this)
        }

        html`
            <div class="BetterPromptContainer">
                <div this=main class="BetterPrompt">
                    <div class="Header">
                        <label class="title">⠕ BetterPrompt Editor ⠪</label>
                        <div class="RightSide">
                            <div this=send_to_other class="Button">Send to ${this.tabname === 'txt2img' ? 'img2img' : 'txt2img'}</div>
                        </div>
                    </div>
                    <div this=nodesfield class="NodeFeild"></div>
                    <div class="EditorFooter">
                        <div class="leftSide">
                            <div this=compose class="Button Compose">Compose</div>
                            <div this=add_node class="Button">Add Node</div>
                            <div this=add_tags class="Button">Add Tags</div>
                            <div this=add_break class="Button">Add BREAK</div>
                            <div this=fit_content class="Button">Fit content</div>
                            <div this=export class="Button">Export</div>
                            <div this=import class="Button">Import</div>
                        </div>
                        <dev class="rightSide">
=                        </dev>
                    </div>
                </div>
            </div>
        `
            .bind(this)
            .prependTo(this.tab.firstElementChild)

        this.fit_content.addEventListener('click', () => {
            for (const node of this.nodes) {
                if (node.fitContent) node.fitContent()
            }
        })

        this.compose.addEventListener('click', this.composePrompt.bind(this))

        this.add_node.addEventListener('click', async () => {
            const nodeConstructor = await getNodeClass('text')
            const text_node = new nodeConstructor(this, {})
            this.insertNode(text_node)
            this.reflectNodes()
        })

        this.add_break.addEventListener('click', async () => {
            const nodeConstructor = await getNodeClass('break')
            const break_node = new nodeConstructor(this, {})
            this.insertNode(break_node)
            this.reflectNodes()
        })

        this.add_tags.addEventListener('click', async () => {
            const nodeConstructor = await getNodeClass('tags')
            const tags_node = new nodeConstructor(this, {})
            this.insertNode(tags_node)
            this.reflectNodes()
        })

        this.export.addEventListener('click', () => {
            navigator.clipboard.writeText(JSON.stringify(this.getNodesJson(), null, 1))
        })

        this.import.addEventListener('click', () => {
            const json = prompt('Enter json')
            if (!json) return
            const parsed = JSON.parse(json)
            if (!Array.isArray(parsed)) return
            this.loadJson(parsed)
        })

        this.send_to_other.addEventListener('click', this.sendToOtherEditor.bind(this))

        this.asyncConstructor()
            .then(() => console.log('[BetterPrompt] Editor loaded', this))
    }

    getNodesJson() {
        return this.nodes.map(node => node.getJson())
    }

    async asyncConstructor() {
        const nodeConstructor = await getNodeClass('tags')
        this.insertNode(new nodeConstructor(this, {}))
        this.reflectNodes()
    }

    queryTab(cb) {
        return this.tab.querySelector(cb(this.tabname))
    }

    queryTabAll(cb) {
        return this.tab.querySelectorAll(cb(this.tabname))
    }

    async sendToOtherEditor() {
        const otherTab = this.tabname === 'txt2img' ? 'img2img' : 'txt2img'
        this.clickTab(otherTab)
        const otherEditor = this.editors[otherTab]
        await otherEditor.loadJson(this.nodes.map(node => node.getJson()))
    }

    clickTab(which) {
        const tabs = Object.fromEntries([...this.tabNav.children].map(tab => [tab.innerText, tab]))
        const tab = tabs[which]
        tab.click()
    }

    async loadJson(json) {
        this.nodes = [];
        await this.loadNodes(json)
        this.reflectNodes()
        this.composePrompt()
    }

    async loadNodes(json) {
        for (const node of json) {
            const { type } = node
            const nodeConstructor = await getNodeClass(type)
            const newNode = new nodeConstructor(this, node)
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
        reorderElement(this.nodes, node, direction)
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

}
