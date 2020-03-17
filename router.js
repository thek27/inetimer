const fs = require('fs')
const sleep = require('await-sleep')
const puppeteer = require('puppeteer')

module.exports = class Router {
    constructor () {
        puppeteer.launch({
            headless: true,
            // ignoreDefaultArgs: true,
            defaultViewport: {
                width: 1920,
                height: 1080
            },
            args: [
                // '--proxy-server=116.203.255.65:8888',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-web-security',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080'
            ]
        }).then( browser => {
            this.browser = browser
        })

        this.injectScriptText = fs.readFileSync('inject.js', 'utf8')
    }

    async page() {
        try {
            const page = await this.browser.newPage()
            return page
        }
        catch(e) {
            await sleep(1000)
            return this.page()
        }
    }

    async login() {
        const dt = new Date();
        console.log('Login at '+dt.toString());
        let page = await this.page()
        await page.goto('http://192.168.1.1')
        try {
            await page.type('#Frm_Username', 'admin')
            await page.type('#Frm_Password', '7w@hkr85bVhJwx5')
            await page.click('#LoginId')
            await page.waitForNavigation()
        } 
        catch (e) {
        }
        const cookies = await page.cookies()
        await page.close()

        page = await this.page()
        await page.setCookie(...cookies)
        await page.goto('http://192.168.1.1/getpage.lua?pid=1002&nextpage=Internet_Parent_Ctrl_t.lp')
        return page
    }

    async logout() {
        console.log('Logout')
        const page = await this.page()
        await page.goto('http://192.168.1.1')
        await page.click('#logOff')
        await page.close()
    }

    async inject(func) {
        const page = await this.login()
        await page.evaluate(scriptText => {
            const el = document.createElement('script');
            el.type = 'text/javascript';
            el.textContent = scriptText;
            document.body.parentElement.appendChild(el);
        }, this.injectScriptText + func);
        return page
    }

    async pcRuleStatus() {
        const page = await this.inject('pcRuleStatus();')
        await page.waitForFunction(`document.querySelector('#pcRuleStatus').value !== ''`)
        const pcRuleStatus = await page.evaluate(()=>{
            return document.querySelector('#pcRuleStatus').innerText
        })
        console.log('pcRuleStatus: '+pcRuleStatus)
        await page.close()
        await this.logout()
        
        return (pcRuleStatus=='1') ? 'on' : 'off'
    }

    async pcRuleOn() {
        const page = await this.inject('pcRuleOn();')
        await page.close()
        await this.logout()
        console.log('pcRuleOn')
        return 'on'
    }

    async pcRuleOff() {
        const page = await this.inject('pcRuleOff();')
        await page.close()
        await this.logout()
        console.log('pcRuleOff')
        return 'off'
    }
}