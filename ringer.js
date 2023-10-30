const OutGPIO = require('./helpers/OutGPIO');

class Ringer {

    constructor() {
        this.off_length = 0.02;
        this.on_length = 0.02;
        this.no_of_pulses = 20;
        this.bell1GPIO = new OutGPIO(17);
        this.bell1GPIO.init();
        this.bell2GPIO = new OutGPIO(27);
        this.bell2GPIO.init();
        this.ringing = false;
    }

    async delay(timeInMs) {
        return new Promise(async (kept, broken) => {
            setTimeout(async () => {
                return kept("tick");
            }, timeInMs);
        });
    }

    async ding() {
        this.bell1GPIO.on();
        await this.delay(25);
        this.bell1GPIO.off()
        this.bell2GPIO.on();
        await this.delay(25);
        this.bell2GPIO.off();
        return;
    }

    async repeatRing(length) {
        for (let i = 0; i < length; i++) {
            await this.ding();
            if (!this.ringing) {
                return;
            }
        }
    }

    async ukRing() {
        while (this.ringing) {
            await this.repeatRing(10);
            await this.delay(100);
            await this.repeatRing(10);
            await this.delay(1400);
        }
    }

    async pickup() {
        // park the clapper in the middle
        this.bell1GPIO.off();
        this.bell2GPIO.on();
        await this.delay(10);
        this.bell2GPIO.off();
    }

    async startRinging() {
        if (this.ringing) {
            return;
        }

        this.ringing = true;
        await this.ukRing();
    }

    stopRinging() {
        this.ringing = false;
    }

    async test(){
        let count = 0;
        while(true){
            console.log(`Tick: ${count}`);
            count++;
            this.bell1GPIO.on();
            this.bell2GPIO.off();
            await this.delay(1500);
            this.bell1GPIO.off()
            this.bell2GPIO.on();
            await this.delay(500);
        }
    }
}

module.exports = Ringer;

