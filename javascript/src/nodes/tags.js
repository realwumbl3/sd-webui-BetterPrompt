import zyX, { html, css } from '../zyX-es6.js'
import Node from '../node.js'

export default class TagsNode extends Node {
    constructor(editor, initialJson) {
        super(editor, {
            name: 'Tags Node',
            type: 'tag',
            value: [],
            ...initialJson
        })

        html`
            <div class=TagsNode this=tags_container></div>
        `.bind(this).appendTo(this.nodearea)

        this.reflectTags()
    }

    addTag(tag) {

    }

    reflectTags() {
        this.tags_container.innerHTML = ''
        this.getJson().value.forEach(tag => new Tag(this, tag).appendTo(this.tags_container))
    }

    toPrompt() {
        if (this.isMuted()) return false
        const value = this.getJson().value
        return value.join(', ')
    }
}


class Tag {
    constructor(tagNode, initialValue) {
        this.tagNode = tagNode
        this.value = initialValue

        html`
            <textarea class=TagsTag this=textarea style="height: 42px;">${this.value}</textarea>
        `.bind(this).appendTo(this.nodearea)

        this.textarea.addEventListener('input', () => {

        })

    }

}
