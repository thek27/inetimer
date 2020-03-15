const fs = require('fs')
const express = require('express')
const enableWs = require('express-ws')

const Router = require('./router')
const router = new Router()

const Timer = require('./timer')
const timer = new Timer(router)

const app = express()
enableWs(app)

app.get('/', async function (req, res) {
    res.send(fs.readFileSync('index.html', 'utf8'))
})

app.get('/waiting.gif', async function (req, res) {
    var s = fs.createReadStream('waiting.gif')
    s.on('open', function () {
        res.setHeader('Content-Type', 'image/gif')
        s.pipe(res)
    })
})

app.ws('/timer', async (ws, req) => {
    
    ws.on('message', msg => {
        if (msg=='init') {
            timer.ws = ws
            return
        }
        if (msg=='start') {
            timer.pcRuleOff()
            return
        }
        if (msg=='stop') {
            timer.pcRuleOn()
            return
        }
    })

    ws.on('close', () => {
        timer.ws = null
    })
})

app.listen(8000)