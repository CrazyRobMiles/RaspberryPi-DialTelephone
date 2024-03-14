const recorder = require('node-record-lpcm16');
const fs = require('fs');

class SoundInput {
    constructor(owner) {
      this.recordingStream = null;
    }

    recordFile(soundFileName){
      if(this.recordingStream===null){
          let filename = `./sounds/${soundFileName}.wav`;
          console.log(`Recording file: ${filename}`);
          const file = fs.createWriteStream(filename, { encoding: 'binary' });
          this.recordingStream = recorder.record({
            sampleRate: 16000,
            channels: 1,
            device: 'plughw:1,0'
          }).stream()
          .on('error', console.error)
          .pipe(file);
          console.log('Recording for 30 seconds...');
          setTimeout(() => {
              this.stopRecording();
          }, 30000);
      }
    }

    stopRecording(){
      if(this.recordingStream){
        this.recordingStream.stop();
        this.recordingStream = null;
        console.log('Recording stopped');
      }
    }
}

module.exports = SoundInput;