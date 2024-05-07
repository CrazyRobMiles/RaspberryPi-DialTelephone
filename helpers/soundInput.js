const fs = require('fs');
const mic = require('mic');

class SoundInput {

    startRecording(filename){

      if(this.mic){
        console.log("already recording");
        return;
      }

      console.log(`Recording to ${filename}`);

      this.mic = mic({
        rate: '48000',
        channels: '1',
        debug: false,
        exitOnSilence: 6
      });

      this.micInputStream = this.mic.getAudioStream();
      this.outputFileStream = fs.createWriteStream(filename);
      this.micInputStream.pipe(this.outputFileStream);
      this.filename = filename;
      this.recordingLength = null;
      this.recordingStartDate = new Date();
      this.mic.start();
    }

    stopRecording(){

      if(!this.mic){
        console.log("***** Stop recording called before start recording");
        return;
      }

      let currentDate = new Date();

      this.recordingLengthInMillis = currentDate - this.recordingStartDate;

      console.log(`Recording to ${this.filename} complete ${this.recordingLengthInMillis} milliseconds long`);
      this.mic.stop();
      this.micInputStream.unpipe();
      this.micInputStream.destroy();
      this.micInputStream = null;
      this.mic = null;
    }

    getRecordingLengthInMillis(){
      return this.recordingLengthInMillis;
    }

    constructor(owner) {
      this.mic = null;
      this.recordingLengthInMillis = null;
      this.recordingStartDate = null;
    }
}

module.exports = SoundInput;