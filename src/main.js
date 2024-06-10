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
            const text_node = new TextNode()
            this.nodesfield.append(text_node.main)
            this.nodes.push(text_node)
        })

        this.export.addEventListener('click', () => {
            const json = this.nodes.map(node => node.json)
            navigator.clipboard.writeText(JSON.stringify(json))
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
                const text_node = new TextNode()
                text_node.json = node
                text_node.textarea.value = node.value
                text_node.textarea.dispatchEvent(new Event('input', { bubbles: true }))
                this.nodesfield.append(text_node.main)
                this.nodes.push(text_node)
            }
        }
    }

    composePrompt() {
        const prompt = this.nodes.map(node => node.toPrompt()).join(', ')
        this.textarea.value = prompt
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }
}

class TextNode {
    constructor() {
        html`
        <div class="Node" this="main">
            <div class="Controls">
                <div class=Button this="mute">Mute</div>
            </div>
            <textarea class=BasicText this=textarea style="height: 43px;"></textarea>
        </div>
        `.bind(this)

        this.is_muted = false

        this.mute.addEventListener('click', () => {
            this.is_muted = !this.is_muted
            this.mute.textContent = this.is_muted ? 'Unmute' : 'Mute'
            this.main.style.opacity = this.is_muted ? 0.5 : 1
        })

        this.json = {
            type: 'text',
            value: ''
        }

        this.textarea.addEventListener('input', () => {
            this.json.value = this.textarea.value
        })
    }

    toPrompt() {
        if (this.is_muted) return ''
        return this.json.value.replace(/\n/g, ', ')
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
            padding: 5px;
            border-radius: 5px;
            display: flex;
            gap: 5px;

            & > .Controls {
                user-select: none;
                padding: 5px;
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

    & .footer {
        display: flex;
        justify-content: space-between;
        padding: .5em;
    }   

}
`
