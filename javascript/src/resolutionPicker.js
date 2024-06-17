import zyX, { html } from './zyX-es6.js'
import { updateInput } from './util.js'

export class ResolutionPicker {
    constructor(betterprompt) {
        this.betterprompt = betterprompt
        this.resolutionButtons = buildResolutionButtons(resolutions)
        const widthInput = this.getSizeInput("width")
        html`
            <div this=presets class="ResolutionPicker" zyx-click="${this.onClick.bind(this)}">
                ${this.resolutionButtons}
            </div>
        `
            .bind(this)
            .prependTo(widthInput.parentElement.parentElement)

        this.setUpSizeChangeListener()
    }

    onClick(e) {
        const target = e.target.closest('[resolution]')
        if (!target) return
        const [width, height] = target.getAttribute('resolution').split('*')
        this.setWidthHeightParams(width, height)
    }

    reflectState(w, h) {
        this.resolutionButtons.forEach(_ => _.reflectMatch?.(w, h))
    }

    getSizeInput(axis) {
        return this.betterprompt.queryTab(tab => `#${tab}_${axis} input[type="number"]`)
    }

    getSizeSliders(axis) {
        return this.betterprompt.queryTab(tab => `#${tab}_${axis} input[type="range"]`)
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
        this.reflectState(...this.getSizeParams());
    }
}

const SPACER = 1;
const NEWLINE = 2;

export const resolutions = [
    [1152, 896, "4:3"],
    [1344, 768, "16:9"],
    [1536, 640, "21:9"],
    SPACER,
    [896, 1152, "3:4"],
    [768, 1344, "9:16"],
    [640, 1536, "9:21"],
    NEWLINE,
    [1024, 1024, "1:1"],
    [1280, 1280, "1:1"],
    [1440, 1440, "1:1"],
    SPACER,
    [1600, 1600, "1:1"],
    [1800, 1800, "1:1"],
    [2048, 2048, "1:1"],
]

export class ResolutionButton {
    constructor(w, h, t) {
        this.res = [w, h]
        html`<div this=main class="Button Resolution" resolution="${w}*${h}" title="${t}">${w}x${h}</div>`.bind(this)
    }

    matches(w, h) {
        return this.res[0] === w && this.res[1] === h
    }

    reflectMatch(w, h) {
        this.main.classList.toggle('active', this.matches(w, h))
    }
}

export function buildResolutionButtons(array) {
    return array.map(_ => {
        switch (_) {
            case SPACER: return html`<div class="Separator"></div>`
            case NEWLINE: return html`<div class="Newline"></div>`
            default: return new ResolutionButton(..._)
        }
    })
}
