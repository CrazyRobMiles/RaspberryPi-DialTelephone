const Ringer = require('./ringer');
const HandsetSwitch = require('./handsetSwitch');
const Dial = require('./dial');
const SoundOutput = require('./helpers/soundOutput');
const SoundInput = require('./helpers/soundInput');
const SpeechOutput = require('./helpers/speechOutput');
const SpeechInput = require('./helpers/speechInput');
const LLM = require('./helpers/LLM');

class Phone{

    randomMessages = [
        "I know what you did last summer",
        "Is that you, Boris?",
        "Look out of the window.",
        "They are on to you.",
        "Look behind you."
        ];
    
    getRandom(min, max) {
        let range = max - min;
        let result = Math.floor(Math.random() * (range)) + min;
        return result;
        }
    
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
        this.speechInput = new SpeechInput(this);
        this.llm = new LLM(this);
        this.ringing = false;
        this.ringStart = null;
        this.randomCallStart = null;
        this.recordMessageTimerDate = null;
        this.playbackMessageTimerDate = null;
        this.questionMessageTimer = null;
        this.ringLengthMillis = 10000;
        this.randomCallTimeoutMillis = 10000;
        this.incomingSpeechDelayMillis = 1000;
        this.recordPromptDelayMillis = 1500;
        this.recordMaximumLengthMillis = 10000;
        this.receiveRingDelayMillis = 500;
        this.playbackMessageDelayMillis = 0;
        this.playbackMessageTimeoutMillis = 60000;
        this.questionMessageDelayMillis = 0;
        this.questionText = null;
        this.dialing=false;
        this.recording=false;
        this.message = null;
        this.eventCounter = 0;
        this.updateActive = false;

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
                    this.soundOutput.stopPlayback();
                    this.ringer.ding(); 
                    return 'REST'; 
                },
                'Incoming message': (message) => { 
                    this.message = message;
                    this.ringer.startRinging();
                    this.ringStart = new Date();
                    return 'INCOMING_TEXT_MESSAGE_CALL'; 
                },
                'LLM reply received':(message) => { 
                    this.message = message;
                    this.ringer.startRinging();
                    this.ringStart = new Date();
                    return 'INCOMING_TEXT_MESSAGE_CALL'; 
                },
                'Incoming question': (text) => { 
                    this.llm.askAI(text);
                    return 'REST';
                },
                'Test ring requested':() => { 
                    this.ringer.startRinging();
                    this.ringStart = new Date();
                    return 'TEST_RING'; 
                }
            },

            INCOMING_TEXT_MESSAGE_CALL:{
                'Handset picked up': () => { 
                    this.ringer.stopRinging();
                    this.ringStart = new Date();
                    return 'INCOMING_TEXT_MESSAGE_DELAY'; 
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
                    return 'INCOMING_TEXT_MESSAGE_CALL'; 
                }
            },

            INCOMING_TEXT_MESSAGE_DELAY : {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.ringStart = null;
                    return 'REST'; 
                },
                'Timer tick': (date) => {
                    if(this.ringStart != null){
                        let waitTime = date - this.ringStart;
                        if (waitTime>this.incomingSpeechDelayMillis){
                            this.ringStart = new Date();
                            this.soundOutput.stopPlayback();
                            this.soundOutput.playFile('./sounds/handsetPickup.wav');
                            return 'INCOMING_TEXT_PICKUP_SOUND_PLAYING';
                        }
                    }
                    return 'INCOMING_TEXT_MESSAGE_DELAY';
                }
            },
            INCOMING_TEXT_PICKUP_SOUND_PLAYING : {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.ringStart = null;
                    return 'REST'; 
                },
                'Timer tick': (date) => {
                    if(this.ringStart != null){
                        let waitTime = date - this.ringStart;
                        if (waitTime>this.receiveRingDelayMillis){
                            this.questionMessageTimer = new Date();
                            this.soundOutput.stopPlayback();
                            this.speechOutput.say(this.message);
                            return 'INCOMING_SPEECH_PLAYING';
                        }
                    }
                    return 'INCOMING_TEXT_PICKUP_SOUND_PLAYING';
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

            INCOMING_SPEECH_PLAYING : {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.speechOutput.stopSpeaking();
                    return 'REST'; 
                },
                'Timer tick': (date) => { 
                    if(this.playbackMessageTimerDate){
                        let waitTime = date - this.playbackMessageTimerDate;
                        if (waitTime>this.playbackMessageTimeoutMillis){
                            this.playbackMessageTimerDate=null;
                            this.speechOutput.stopSpeaking();
                            this.soundOutput.playFile('./sounds/numberUnobtainable.wav');
                            return 'REST';
                        }
                    }
                    return 'PLAYBACK_SOUND_PLAYING';
                }
            },

            DIAL_TONE: {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.stopPlayback();
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
                'Test ring ended':() => { 
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
                            this.soundOutput.stopPlayback();
                            this.soundOutput.playFile('./sounds/engagedTone.wav');
                            return 'START_RANDOM_CALL';

                        case 3: // Record a message
                            this.soundOutput.playFile('./sounds/ringingTone.wav');
                            this.recordMessageTimerDate = new Date();
                            this.receiveRingDelayMillis = this.getRandom(1000,3000);
                            return 'RECORD_PICKUP_DELAY';
                        case 4: // Playback a message
                            this.soundOutput.playFile('./sounds/ringingTone.wav');
                            this.playbackMessageTimerDate = new Date();
                            this.playbackMessageDelayMillis = this.getRandom(1000,3000);
                            return 'PLAYBACK_PICKUP_DELAY';
                        case 5: // Receive a question
                            this.soundOutput.playFile('./sounds/ringingTone.wav');
                            this.questionMessageTimer = new Date();
                            this.questionMessageDelayMillis = this.getRandom(1000,3000);
                            return 'QUESTION_PICKUP_DELAY';

                        default:// Do nothing
                            this.soundOutput.playFile('./sounds/numberUnobtainable.wav');
                            return 'REST';
                    }
                }
            },
            PLAYBACK_PICKUP_DELAY : {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.stopPlayback();
                    this.playbackMessageTimerDate = null;
                    return 'REST'; 
                },
                'Timer tick': (date) => {
                    if (this.playbackMessageTimerDate){
                        let waitTime = date - this.playbackMessageTimerDate;
                        if (waitTime>this.playbackMessageDelayMillis){
                            this.playbackMessageTimerDate = new Date();
                            this.soundOutput.stopPlayback();
                            this.soundOutput.playFile('./sounds/handsetPickup.wav');
                            return 'PLAYBACK_PICKUP_SOUND_PLAYING';
                        }
                    }
                    return 'PLAYBACK_PICKUP_DELAY';
                }
            },            
            PLAYBACK_PICKUP_SOUND_PLAYING: {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.stopPlayback();
                    this.recordMessageTimerDate = null;
                    return 'REST'; 
                },
                'Timer tick': (date) => {
                    if(this.playbackMessageTimerDate){
                        let waitTime = date - this.playbackMessageTimerDate;
                        if (waitTime>this.receiveRingDelayMillis){
                            this.playbackMessageTimerDate=null;
                            this.recordMessageTimerDate = new Date();
                            this.soundOutput.stopPlayback();
                            this.soundOutput.playFile('./recordings/message.wav');
                            return 'PLAYBACK_SOUND_PLAYING';
                        }
                    }
                    return 'PLAYBACK_PICKUP_SOUND_PLAYING';
                }
            },
            PLAYBACK_SOUND_PLAYING : {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.stopPlayback();
                    this.recordMessageTimerDate = null;
                    return 'REST'; 
                },
                'Timer tick': (date) => {
                    if(this.playbackMessageTimerDate){
                        let waitTime = date - this.playbackMessageTimerDate;
                        if (waitTime>this.playbackMessageTimeoutMillis){
                            this.playbackMessageTimerDate=null;
                            this.soundOutput.stopPlayback();
                            this.soundOutput.playFile('./sounds/numberUnobtainable.wav');
                            return 'REST';
                        }
                    }
                    return 'PLAYBACK_SOUND_PLAYING';
                }
            },
            RECORD_PICKUP_DELAY : {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.stopPlayback();
                    this.recordMessageTimerDate = null;
                    return 'REST'; 
                },
                'Timer tick': (date) => {
                    if (this.recordMessageTimerDate){
                        let waitTime = date - this.recordMessageTimerDate;
                        if (waitTime>this.receiveRingDelayMillis){
                            this.recordMessageTimerDate = new Date();
                            this.soundOutput.stopPlayback();
                            this.soundOutput.playFile('./sounds/handsetPickup.wav');
                            return 'RECORD_PICKUP_SOUND_PLAYING';
                        }
                    }
                    return 'RECORD_PICKUP_DELAY';
                }
            },            
            RECORD_PICKUP_SOUND_PLAYING: {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.stopPlayback();
                    this.recordMessageTimerDate = null;
                    return 'REST'; 
                },
                'Timer tick': (date) => {
                    if(this.recordMessageTimerDate){
                        let waitTime = date - this.recordMessageTimerDate;
                        if (waitTime>this.receiveRingDelayMillis){
                            this.recordMessageTimerDate = new Date();
                            this.soundOutput.stopPlayback();
                            this.speechOutput.say("Please leave your message");
                            return 'RECORD_PROMPT_MESSAGE_PLAYING';
                        }
                    }
                    return 'RECORD_PICKUP_SOUND_PLAYING';
                }
            },
            RECORD_PROMPT_MESSAGE_PLAYING : {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.stopPlayback();
                    this.recordMessageCallStart = null;
                    return 'REST'; 
                },

                'Timer tick': (date) => {
                    if(this.recordMessageTimerDate){
                        let waitTime = date - this.recordMessageTimerDate;
                        if (waitTime>this.recordPromptDelayMillis){
                            this.recordMessageTimerDate = new Date();
                            this.soundInput.startRecording(`./recordings/message.wav`);
                            return 'RECORDING_MESSAGE';
                        }
                    }
                    return 'RECORD_PROMPT_MESSAGE_PLAYING';
                }
            },
            RECORDING_MESSAGE:{
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundInput.stopRecording();
                    this.recordMessageCallStart = null;
                    return 'REST'; 
                },

                'Timer tick': (date) => {
                    if(this.recordMessageTimerDate){
                        let waitTime = date - this.recordMessageTimerDate;
                        if (waitTime>this.recordMaximumLengthMillis){
                            this.soundInput.stopRecording();
                            this.ringer.ding();
                            return 'REST';
                        }
                    }
                    return 'RECORDING_MESSAGE';
                }
            },
            START_RANDOM_CALL: {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.stopPlayback();
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
                    this.soundOutput.stopPlayback();
                    return 'REST'; }
            },
            QUESTION_PICKUP_DELAY : {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.stopPlayback();
                    this.questionMessageTimer = null;
                    return 'REST'; 
                },

                'Timer tick': (date) => {
                    if (this.questionMessageTimer){
                        let waitTime = date - this.questionMessageTimer;
                        if (waitTime>this.receiveRingDelayMillis){
                            this.questionMessageTimer = new Date();
                            this.soundOutput.stopPlayback();
                            this.soundOutput.playFile('./sounds/handsetPickup.wav');
                            return 'QUESTION_PICKUP_SOUND_PLAYING';
                        }
                    }
                    return 'QUESTION_PICKUP_DELAY';
                }
            },
            QUESTION_PICKUP_SOUND_PLAYING: {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.stopPlayback();
                    this.questionMessageTimer = null;
                    return 'REST'; 
                },
                'Timer tick': (date) => {
                    if(this.questionMessageTimer){
                        let waitTime = date - this.questionMessageTimer;
                        if (waitTime>this.receiveRingDelayMillis){
                            this.questionMessageTimer = new Date();
                            this.soundOutput.stopPlayback();
                            this.speechOutput.say("Ask your question");
                            return 'QUESTION_PROMPT_MESSAGE_PLAYING';
                        }
                    }
                    return 'QUESTION_PICKUP_SOUND_PLAYING';
                }
            },
            QUESTION_PROMPT_MESSAGE_PLAYING : {
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.stopPlayback();
                    this.questionMessageTimer = null;
                    return 'REST'; 
                },

                'Timer tick': (date) => {
                    if(this.questionMessageTimer){
                        let waitTime = date - this.questionMessageTimer;
                        if (waitTime>this.recordPromptDelayMillis){
                            this.questionMessageTimer = new Date();
                            this.soundInput.startRecording(`./recordings/question.wav`);
                            return 'RECORDING_QUESTION';
                        }
                    }
                    return 'QUESTION_PROMPT_MESSAGE_PLAYING';
                }
            },
            RECORDING_QUESTION:{
                'Handset replaced': () => { 
                    this.ringer.ding(); 
                    this.soundInput.stopRecording();
                    this.speechInput.startSpeechDecode(`./recordings/question.wav`);
                    this.questionMessageTimer = new Date();
                    return 'DOING_SPEECH_TO_TEXT'; 
                },

                'Timer tick': (date) => {
                    if(this.questionMessageTimer){
                        let waitTime = date - this.questionMessageTimer;
                        if (waitTime>this.recordMaximumLengthMillis){
                            this.soundInput.stopRecording();
                            this.ringer.ding();
                            return 'REST';
                        }
                    }
                    return 'RECORDING_QUESTION';
                }
            },
            DOING_SPEECH_TO_TEXT:{
                'Handset picked up': () => { 
                    this.ringer.ding(); 
                    this.soundOutput.playFile('./sounds/dialTone.wav');
                    return 'DIAL_TONE'; 
                },
                'Text decoded': (text) => {
                    this.questionText = text;
                    console.log(`Speech decoded successfully: ${text}`);
                    this.llm.askAI(text);
                    return 'REST';
                }
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

    acceptQuestion(question){
        this.handleEvent('Incoming question',question);
    }

    speechDecodedSuccessfully(text){
        this.handleEvent('Text decoded',text);
    }

    LLMReplyReceived(text){
        console.log(`Got LLM reply ${text}`);
        this.handleEvent('LLM reply received',text);
    }
    
    update(){
        if(this.updateActive){
            console.log("  *****");
            return;
        }
        this.updateActive = true;
        let date = new Date();
        this.handleEvent('Timer tick', date);
        this.updateActive = false;
    }

    ding(){
        this.ringer.ding();
    }


    dialPulse(){
    }

    startRinging()
    {
        this.handleEvent('Test ring requested');
    }

    stopRinging(){
        this.handleEvent('Test ring ended');
    }

}

module.exports = Phone;
