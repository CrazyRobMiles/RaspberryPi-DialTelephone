const InGPIO = require('./helpers/InGPIO');

class Dial{

    dialing = false;

    pulseHandler(value){
        console.log(`Pulse handler:${value}`);
        console.log(Dial.dialing);
    }

    dialHandler(value){
        console.log(`Dial handler:${value}`);
    }

    startDialing(){
        this.dialing = true;
        this.pulseCount = 0;
        this.owner.dialStarted();
    }

    dialPulse(){
        if(this.dialing){
            this.pulseCount++;
            this.owner.dialPulse();
        }
    }

    endDialing(){
        console.log(`    Dialed a:${this.pulseCount}`);
        this.owner.numberDialed(this.pulseCount);
        this.dialing = false;
    }

    constructor(owner) {
        this.owner = owner;
        this.dialing = false;
        this.pulseCount = 0;
        let dialPulseGPIO = new InGPIO(23, (value)=> {
            if(value==1) {
                this.dialPulse();
            }
        });
        let dialingOnGPIO = new InGPIO(24,(value) => {
            if(value==1){
                this.startDialing();
            }
            else {
                this.endDialing();
            }
        });
    }
}

module.exports = Dial;
