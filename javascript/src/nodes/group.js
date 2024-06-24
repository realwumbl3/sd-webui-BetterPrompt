import zyX, { html, css } from '../zyX-es6.js'
import Node from '../node.js'

export default class GroupNode extends Node {
    constructor(editor, initialJson) {
        super(editor, {
            name: 'Group Node',
            type: 'group',
            value: [],
            ...initialJson
        })

        html`
            <div class=Group this=options>

            </div>
        `.join(this).appendTo(this.nodearea)

    }

    toPrompt() {
        if (this.isMuted()) return false
        const value = this.getJson().value
        return `${value.toUpperCase()}\n`
    }
}
