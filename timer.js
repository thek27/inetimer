
const initTimeSecs = 60*60*6
const lifeTimeCache = 60*60*24;

const MemcacheClient = require("memcache-client")
const memcacheClient = new MemcacheClient({ server: "localhost:11211" })

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

module.exports = class Timer {

    constructor (router) {
        this.ws = null;
        this.router = router
        this.waiting = false
        this.pcRuleStatus = ''
        setInterval(() => { this.checkRestTimeSecs() }, 1000)
    }

    getKey() {
        const dt = new Date()
        dt.setHours(dt.getHours() - 2) // every day start at 02:00
        const fakeToday = dt.getFullYear()+(dt.getMonth()+1).pad(2)+dt.getDate().pad(2)
        return 'pcRuleSecs'+fakeToday
    }

    async getRestTimeSecs() {
        const key = this.getKey()
        return memcacheClient.get(key).then(async (data, error) => {
            if (data && data.value>0) return data.value
            memcacheClient.set(key, initTimeSecs, {lifetime: lifeTimeCache})
            return initTimeSecs
        })
    }

    async checkRestTimeSecs() {
        if (this.waiting) {
            return
        }
        if (this.pcRuleStatus=='') {
            this.waiting = true
            this.pcRuleStatus = await this.router.pcRuleStatus()
            this.waiting = false
        }
        this.restTimeSecs = await this.getRestTimeSecs()
        // console.log('restTimeSecs ',this.restTimeSecs)
        if (this.pcRuleStatus=='off') {
            --this.restTimeSecs
        }
        if (this.restTimeSecs==0) {
            this.pcRuleOn()
        }
        if (this.ws) {
            this.ws.send(JSON.stringify({ 'secs': this.restTimeSecs, 'rule': this.pcRuleStatus }))
        }
        memcacheClient.set(this.getKey(), this.restTimeSecs, {lifetime: lifeTimeCache})
    }

    async pcRuleOn() {
        this.waiting = true
        this.pcRuleStatus = await this.router.pcRuleOn()
        this.waiting = false
    }

    async pcRuleOff() {
        this.waiting = true
        this.pcRuleStatus = await this.router.pcRuleOff()
        this.waiting = false
    }
}
