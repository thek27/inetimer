
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
        this.restTimeSecs = 0;
        setInterval(() => { this.checkRestTimeSecs() }, 1000)
        setInterval(() => { this.checkRuleStatus() }, 1000 * 60 * 10)
        // memcacheClient.set(this.getKey(), 60*60*2, {lifetime: lifeTimeCache})
    }

    async addHour() {
        this.restTimeSecs = await this.getRestTimeSecs()
        this.restTimeSecs+=60*60
        memcacheClient.set(this.getKey(), this.restTimeSecs, {lifetime: lifeTimeCache})
    }

    getKey() {
        const dt = new Date()
        dt.setHours(dt.getHours() + 22) // every day start at 22:00
        const fakeToday = dt.getFullYear()+(dt.getMonth()+1).pad(2)+dt.getDate().pad(2)
        return 'pcRuleSecs'+fakeToday
    }

    async getRestTimeSecs() {
        const key = this.getKey()
        return memcacheClient.get(key).then(async (data, error) => {
            if (data) return data.value || 0
            memcacheClient.set(key, this.restTimeSecs + initTimeSecs, {lifetime: lifeTimeCache})
            return initTimeSecs
        })
    }

    async checkRuleStatus() {
        if (this.waiting) {
            return
        }
        this.pcRuleStatus = await this.router.pcRuleStatus()
        let s = this.restTimeSecs
        const h = parseInt(s/3600)
        s-=h*3600
        const m = parseInt(s/60)
        s-=m*60
        console.log('RestTime: '+h.pad(2)+':'+m.pad(2)+':'+s.pad(2))
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
        if (this.restTimeSecs>0 && this.pcRuleStatus=='off') {
            --this.restTimeSecs
        }
        if (this.ws) {
            try {
                this.ws.send(JSON.stringify({ 'secs': this.restTimeSecs, 'rule': this.pcRuleStatus }))
            }
            catch(e) {
            }
        }
        memcacheClient.set(this.getKey(), this.restTimeSecs, {lifetime: lifeTimeCache})

        if (this.restTimeSecs==0 && this.pcRuleStatus=='off') {
            await this.pcRuleOn()
        }
    }

    async pcRuleOn() {
        if (this.waiting) {
            return
        }
        this.waiting = true
        this.pcRuleStatus = '';
        this.pcRuleStatus = await this.router.pcRuleOn()
        this.waiting = false
    }

    async pcRuleOff() {
        if (this.waiting) {
            return
        }
        this.waiting = true
        this.pcRuleStatus = '';
        this.pcRuleStatus = await this.router.pcRuleOff()
        this.waiting = false
    }
}
