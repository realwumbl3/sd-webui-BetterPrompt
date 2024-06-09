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
                <label class="title">BetterPrompt Editor</label>
                <div this=nodesfield class="NodeFeild"></div>
                <div class="footer">
                    <div this=compose class="Compose">Compose</div>
                    <div this=add_node class="Compose">Add Node</div>
                </div>
            </div>
        `
            .bind(this)
            .const()

        this.compose.addEventListener('click', this.composePrompt.bind(this))

        this.add_node.addEventListener('click', () => {
            const text_node = new Node()
            this.nodesfield.append(text_node.main)
            this.nodes.push(text_node)
        })

        tab.firstElementChild.prepend(this.main)
    }

    composePrompt() {
        const prompt = this.nodes.map(node => node.toPrompt()).join('\n')
        this.textarea.value = prompt
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }
}

class Node {
    constructor() {
        html`
        <div class="Node" this="main">
            <div class="Controls">
                <div class=Button this="mute">Mute</div>
                <div class=Button this="solo">Solo</div>
            </div>
            <textarea class=BasicText this=textarea></textarea>
        </div>
        `.bind(this)

        this.is_muted = false
        this.is_solo = false

        this.mute.addEventListener('click', () => {
            this.is_muted = !this.is_muted
            this.mute.textContent = this.is_muted ? 'Unmute' : 'Mute'
        })

        this.solo.addEventListener('click', () => {
            this.is_solo = !this.is_solo
            this.solo.textContent = this.is_solo ? 'Unsolo' : 'Solo'
        })

        this.value = ''
    }

    toPrompt() {
        if (this.is_muted) return ''
        return this.textarea.value;
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
            padding: 5px;
            border-radius: 5px;
            display: flex;
            gap: 5px;

            & > .Controls {
                user-select: none;
                padding: 5px;
                &>.Button {
                    cursor: pointer;
                }
            }

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
`
