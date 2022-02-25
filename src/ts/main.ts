import {add} from './modules/helper';
const worker = new Worker('worker.js')
const panel= document.getElementById('panel')
panel.style.height = 60+'px'
setTimeout(() => {
    panel.style.height = 100+'%'
    const str = String(add(5,5))
    document.body.innerText = str
}, 1000);
