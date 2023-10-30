const Ringer = require('./ringer');
const HandsetSwitch = require('./handsetSwitch');
const Dial = require('./dial');
const SoundOutput = require('./helpers/soundOutput');
const Speech = require('./speech');

class Phone{

    async delay(timeInMs) {
        return new Promise(async (kept, broken) => {
            setTimeout(async () => {
                return kept("tick");
            }, timeInMs);
        });
    }

constructor(owner) {
    this.owner = owner;
    this.ringer = new Ringer();
    this.handsetSwitch = new HandsetSwitch(this);
    this.dial = new Dial(this);
    this.soundOutput = new SoundOutput(this);
    this.speech = new Speech(this);
    this.ringing = false;
    this.ringStart = null;
    this.ringLengthMillis = 10000;
    this.dialing=false;
    this.messages = null;

    setInterval(() => {
        this.update();
        }, 500);
}

doDial(){

    if(this.dialing){
        console.log("doDial called when already dialing");
        return;
    }

    console.log("Dialing");

    this.dialing = true;

    this.soundOutput.playFile('dialTone');
}

handsetPickedUp(){
    if(this.ringer.ringing){
        this.stopRinging();
        if(this.message){
            this.delay(1000).then(()=> {
                console.log(`Saying message:${this.message}`);
                this.speech.say(this.message);
                this.message = null;
            });
        }
    }
    else{
        this.ringer.ding().then(()=>
        {
            this.doDial();
        });
    };
}

    handsetPutDown(){
        if(this.dialing){
            console.log("Handset replaced while dialing");
            this.soundOutput.stopPlayback();
            this.dialing = false;
        }

        if(this.ringer.ringing){
            this.stopRinging();
        }
        else{
            this.ringer.ding();
        }
    }

    dialStarted(){
        if(this.dialing){
            console.log("Dial started whilst dialing");
            this.soundOutput.stopPlayback();
        }
    }

    dialPulse(){
        if(this.dialing){
            console.log("Dial pulse");
        }
    }

     stopRinging(){
        console.log("Stopping ringing");
        this.ringing=false;
        this.ringStart=null;
        this.ringer.stopRinging();
      }

      getRandom(min, max) {
        let range = max - min;
        let result = Math.floor(Math.random() * (range)) + min;
        return result;
      }
  
randomMessages = [
    "I know what you did last summer",
    "Is that you, Boris?",
    "Look out of the window.",
    "They are on to you.",
    "Look behind you."
    ];

randomCall(){
    let messageDelayMillis = this.getRandom(2000,5000);
    this.delay(messageDelayMillis).then(()=>{
        let messageNo = this.getRandom(0,this.randomMessages.length);
        this.acceptMessage(this.randomMessages[messageNo]);
    });
}


numberDialed(number){
    if(this.handsetSwitch.handsetOffPhone()){
        this.delay(600).then(()=>
        {
            switch (number){
                case 1: 
                this.startRinging();
                break;
                case 2:
                this.randomCall();
                break;
            }
        });
    }
}

    async startRinging(){
        this.ringing = true;
        this.ringStart = new Date();
        await this.ringer.startRinging();
    }

    acceptMessage(message){
        this.message = message;
        this.startRinging();
    }

    update(){
        let date = new Date();
        if(this.ringing){
            if(this.ringStart != null){
                let ringTime = date - this.ringStart;
                if (ringTime>this.ringLengthMillis){
                    this.stopRinging();
                }
            }
        }
    }
}

module.exports = Phone;
