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
        if (e.key === 'F12') { // f12 console.log all editor instances
            console.log('[BetterPrompt] editors', editors)
        }
    })
})


export function getFileUrl(file) {
    return chrome.runtime ? chrome.runtime.getURL(file) : `BetterPrompt/${file}`
}

// Load styles
css`@import url(${getFileUrl('static/styles.css')});`
