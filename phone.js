const Ringer = require('./ringer');
const HandsetSwitch = require('./handsetSwitch');
const Dial = require('./dial');
const SoundOutput = require('./helpers/soundOutput');
const SoundInput = require('./helpers/soundInput');
const SpeechOutput = require('./helpers/speechOutput');

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
        this.soundInput = new SoundInput(this);
        this.speechOutput = new SpeechOutput(this);
        this.ringing = false;
        this.ringStart = null;
        this.randomCallStart = null;
        this.ringLengthMillis = 10000;
        this.randomCallTimeoutMillis = 10000;
        this.incomingSpeechDelayMillis = 600;
        this.dialing=false;
        this.recording=false;
        this.message = null;
        this.eventCounter = 0;

        // State of the phone
        this.state = "REST";

        // State table for phone
        this.stateActions = {
            REST: {
                'Handset picked up': () => { 
                    this.ringer.ding();
                    this.soundOutput.playFile('./sounds/dialTone.wav');
                    return 'DIAL_TONE'; 
                },
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    return 'REST'; 
                },
                'Incoming message': (message) => { 
                    this.ringer.startRinging();
                    return 'INCOMING_CALL'; 
                }
            },

            INCOMING_TEXT_STRING: {
                'Handset picked up': () => { 
                    this.ringer.stopRinging();
                    return 'INCOMING_SPEECH_DELAY'; 
                },
                'Incoming message': (message) => { 
                    this.message = message;
                    this.ringer.startRinging();
                    return 'INCOMING_MESSAGE'; 
                }
            },
   
            DIAL_TONE: {
                'Handset replaced': () => { 
                    this.soundOutput.stopPlayback();
                    this.ringer.ding(); 
                    return 'REST'; 
                },
                'Number dialed': () => { 
                    this.soundOutput.stopPlayback();
                    return 'DIALING'; 
                }
            },

            TEST_RING: {
                'Handset replaced': () => { 
                    this.ringer.stopRinging();
                    return 'REST'; 
                },
                'Timer tick': (date) => { 
                    if(this.ringStart != null){
                        let ringTime = date - this.ringStart;
                        if (ringTime>this.ringLengthMillis){
                            this.ringStart = null;
                            this.ringer.stopRinging();
                            return 'REST';
                        }
                    }
                    return 'TEST_RING'; 
                }
            },

            DIALING: {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    return 'REST'; },
                'Number dialed (complete)': (number) => { 
                    switch(number){
                        case 1: // Make the phone ring until it is put down
                            this.ringStart = new Date();
                            this.ringer.startRinging();
                            return 'TEST_RING';

                        case 2: // Make a random call
                            this.randomCallStart = new Date();
                            return 'START_RANDOM_CALL';
                }
                }
            },
            START_RANDOM_CALL: {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.randomCallDelayMillis = this.getRandom(1000,5000);
                    this.randomCallStart = new Date();
                    return 'RANDOM_CALL_DELAY'; 
                },
                'Timer tick': (date) => {
                    if(this.ringStart != null){
                        let waitTime = date - this.randomCallStart;
                        if (waitTime>this.randomCallTimeoutMillis){
                            return 'REST';
                        }
                    }
                    return 'START_RANDOM_CALL';
                }
            },
            RANDOM_CALL_DELAY: {
                'Handset picked up': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.playFile('./sounds/dialTone.wav');
                    return 'DIAL_TONE'; 
                },
                'Timer tick': (date) => {
                    if(this.randomCallStart != null){
                        let waitTime = date - this.randomCallStart;
                        if (waitTime>this.randomCallTimeoutMillis){
                            let messageNo = this.getRandom(0,this.randomMessages.length);
                            this.message = this.randomMessages[messageNo];
                            this.ringStart = new Date();
                            this.ringer.startRinging();
                            return 'MESSAGE_RINGING';
                        }
                    }
                    return 'RANDOM_CALL_DELAY';
                }
            },

            MESSAGE_RINGING : {
                'Timer tick': (date) => {
                    if(this.ringStart != null){
                        let waitTime = date - this.ringStart;
                        if (waitTime>this.ringLengthMillis){
                            this.ringer.stopRinging();
                            return 'REST';
                        }
                    }
                    return 'MESSAGE_RINGING';
                },
                'Handset picked up': () => { 
                    this.ringer.stopRinging();
                    this.ringStart = new Date();
                    this.soundOutput.playFile('./sounds/handsetPickup.wav');
                    return 'INCOMING_SPEECH_DELAY'; 
                }
            },
            INCOMING_SPEECH_DELAY : {
                'Timer tick': (date) => {
                    if(this.ringStart != null){
                        let waitTime = date - this.ringStart;
                        if (waitTime>this.incomingSpeechDelayMillis){
                            this.speechOutput.say(this.message);
                            return 'PLAYING_SPEECH_MESSAGE';
                        }
                    }
                    return 'INCOMING_SPEECH_DELAY';
                }
            },
            PLAYING_SPEECH_MESSAGE : {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    return 'REST'; }
            },
            COMMAND_EXECUTION: {
                'Handset replaced': () => { stopCurrentCommand(); return 'REST'; },
                'Timeout (30 sec)': () => { stopCurrentCommand(); return 'REST'; },
                'Command execution complete': () => { return 'REST'; }
            },
            WAITING_FOR_RESPONSE: {
                'Handset picked up': () => { stopRinging(); playResponse(); return 'REST'; },
                'Handset replaced': () => { return 'REST'; },
                'Server response received': () => { ringBell(); return 'WAITING_FOR_PICKUP'; }
            },
            WAITING_FOR_PICKUP: {
                'Handset picked up': () => { stopRinging(); playResponse(); return 'REST'; },
                'Handset replaced': () => { return 'REST'; },
                'Timeout (30 sec)': () => { stopRinging(); return 'REST'; }
            }
        };

        // Start the heartbeat
        setInterval(() => {
            this.update();
            }, 500);
    }

    // Master event handler
    handleEvent(event, data = null) {
        this.eventCounter++;
        console.log(`${this.eventCounter} Event '${event}' fired in state '${this.state}'`);
        if (this.stateActions[this.state] && this.stateActions[this.state][event]) {
        this.state = this.stateActions[this.state][event](data);
        console.log(`   state changed to '${this.state}'`);
        }
    }

    // Bindings to the phone events

    handsetPickedUp(){
        this.handleEvent('Handset picked up');
    }

    handsetPutDown(){
        this.handleEvent('Handset replaced');
    }

    dialStarted(){
        this.handleEvent('Number dialed');
    }

    numberDialed(number){
        this.handleEvent('Number dialed (complete)',number);
        return;
    }
    
    acceptMessage(message){
        this.handleEvent('Incoming message',message);
    }
    
    update(){
        let date = new Date();
        this.handleEvent('Timer tick', date);
    }




doDial(){

    if(this.dialing){
        console.log("doDial called when already dialing");
        return;
    }

    console.log("Dialing");

    this.dialing = true;

    this.soundOutput.playFile('./sounds/dialTone.wav');
}

ding(){
    this.ringer.ding();
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

receiveQuestion(){
    this.soundOutput.playFile('./sounds/ringingTone.wav');
    let ringDelayMillis = this.getRandom(1000,3000);
    this.delay(ringDelayMillis).then(()=>{
        this.soundOutput.stopPlayback();
        this.soundOutput.playFile('./sounds/handsetPickup.wav');
        let pickupDelayMillis = 1500;
        this.delay(pickupDelayMillis).then(()=>{
            this.speechOutput.say("Ask your question and replace the handset. I will call back with the answer.");
            this.soundInput.recordFile("./messages/question.wav");
        });
    });
}

playQuestion(){
    this.soundOutput.playFile('./sounds/ringingTone.wav');
    let ringDelayMillis = this.getRandom(1000,3000);
    this.delay(ringDelayMillis).then(()=>{
        this.soundOutput.stopPlayback();
        this.soundOutput.playFile('./sounds/handsetPickup.wav');
        let pickupDelayMillis = 1500;
        this.delay(pickupDelayMillis).then(()=>{
            this.speechOutput.say("Ask your question and replace the handset. I will call back with the answer.");

            this.soundInput.recordFile("message");
        });
    });
}

oldnumberDialed(number){
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
                case 3:
                this.receiveQuestion();
                break;
                case 4:
                this.playQuestion();
                break;
            }
        });
    }
}

    acceptMessage(message){
        this.message = message;
        this.startRinging();
    }

}

module.exports = Phone;
