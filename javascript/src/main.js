import zyX, { html, css } from './zyX-es6.js'
import observe from './observer.js'

import Editor from './editor.js'

console.log('[BetterPrompt] main.js loaded')
observe(document.body, "#tabs", (tabs) => {
    console.log('[BetterPrompt] #tabs', tabs)
    const tabNav = tabs.querySelector('.tab-nav')
    const editors = {}
    editors.txt2img = new Editor(editors, { tabNav, tabs }, "txt2img")
    editors.img2img = new Editor(editors, { tabNav, tabs }, "img2img")
    document.body.addEventListener('keydown', (e) => {
        if (e.key === 'F12') {
            console.log('[BetterPrompt] editors', editors)
        }
    })
})
// listen for f12 keypress, console.log all editor instances


if (chrome.runtime) css`@import url(${chrome.runtime.getURL('static/styles.css')});`
else css`@import url('BetterPrompt/static/styles.css');`

export function getFileUrl(file) {
    return chrome.runtime ? chrome.runtime.getURL(file) : `BetterPrompt/${file}`
}
