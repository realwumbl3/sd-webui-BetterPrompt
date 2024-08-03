import zyX, { html, css } from './zyX-es6.js'

export default class AutoFitInput {
    constructor({ placeholder = "enter tag" } = {}) {
        // put an invisible span in the input to measure the text width
        html`
            <span class=AutoFitInput>
                <span this=span>${placeholder}</span>
                <input this=input type="text" placeholder="${placeholder}"/>
            </span>
        `.bind(this)
        this.input.addEventListener('input', () => this.updateSpan())
    }

    focus() {
        this.input.focus()
    }

    addEventListener(...args) {
        this.input.addEventListener(...args)
    }

    set(value) {
        this.input.value = value
        this.updateSpan()
    }

    value() {
        return this.input.value
    }

    selectionStart() {
        return this.input.selectionStart
    }

    updateSpan() {
        this.span.textContent = this.input.value < 1 ? this.input.placeholder : this.input.value
    }
}
