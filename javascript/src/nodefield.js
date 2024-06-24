import zyX, { html, ZyXArray } from './zyX-es6.js'
import { getNodeClass } from './node.js'
import { reorderElement } from './util.js'


export default class NodeField {
    constructor() {
        this.nodes = new ZyXArray()
        html`
            <div this=nodefield class=NodeField zyx-array="${{ array: this.nodes }}"></div>
        `.bind(this)
    }

    async addByType(type) {
        const nodeConstructor = await getNodeClass(type)
        const break_node = new nodeConstructor(this, {})
        this.insertNode(break_node)
    }

    async loadJson(json) {
        this.nodes.clear()
        await this.loadNodes(json)
    }

    async loadNodes(json) {
        const load = [];
        for (const node of json) {
            const { type } = node
            const nodeConstructor = await getNodeClass(type)
            load.push(new nodeConstructor(this, node))
        }
        this.nodes.push(...load)
    }

    culmJson() {
        return this.nodes.map(node => node.getJson())
    }

    insertNode(node, index) {
        console.log('inserting node', node)
        this.nodes.splice(index ?? this.nodes.length, 0, node)
    }

    reorderNode(node, direction) {
        reorderElement(this.nodes, node, direction)
    }

    removeNode(node) {
        this.nodes.splice(this.nodes.indexOf(node), 1)
    }

    composePrompt() {
        const prompt = this.nodes.map(node => node.toPrompt()).filter(Boolean).join(' ')
        return prompt
    }

    fitContent() {
        this.nodes.forEach(node => node.fitContent?.())
    }

}
