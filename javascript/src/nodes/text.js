import zyX, { html, css } from '../zyX-es6.js'
import Node from '../node.js'

export default class TextNode extends Node {
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
        `.join(this).appendTo(this.nodearea)

        this.textarea.addEventListener('input', () => {
            this.assignJson({ value: this.textarea.value })
            this.resizeToFitScrollheight()
        })

        setTimeout(() => this.resizeToFitScrollheight(), 1)
    }

    fitContent() {
        this.resizeToFitScrollheight()
    }   

    resizeToFitScrollheight() {
        this.textarea.style.height = 'auto'
        const scrollHeight = Math.max(this.textarea.scrollHeight, 58);
        this.textarea.style.height = `${scrollHeight}px`
    }

    toPrompt() {
        if (this.isMuted()) return false
        const value = this.getJson().value
        return value.replace(/\n/g, ' ').replace(/,+/g, ',').replace(/  +/g, ' ')
    }
}
