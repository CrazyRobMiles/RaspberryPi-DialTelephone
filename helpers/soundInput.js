const recorder = require('node-record-lpcm16');
const fs = require('fs');

class SoundInput {
    constructor(owner) {
      this.recordingStream = null;
    }

    recordFile(soundFileName){
     
      this.recordingStream = recorder.record({
        sampleRate: 16000,
        channels: 1,
        // Adjust the device according to your setup
        device: 'plughw:1,0'
      });
      
      const fileStream = fs.createWriteStream(soundFileName, { encoding: 'binary' });

      this.recordingStream.stream().pipe(fileStream);
      
      console.log('Recording for 50 seconds...');
      
      // Schedule the stop after 50 seconds even if the handset is not repleaced
      setTimeout(() => {
        try {
          if(this.recordingStream){
            console.log('Recording stopped by timeout');
            recordingStream.stop(); // Attempt to stop recording
            this.recordingStream = null;
          }
        } catch (error) {
          console.error('Error stopping recording:', error.message);
        }
      }, 50000);

      // return;

      // if(this.recordingStream===null){
      //     let filename = `./sounds/${soundFileName}.wav`;
      //     filename="test.wav";
      //     console.log(`Recording file: ${filename}`);
      //     const file = fs.createWriteStream(filename, { encoding: 'binary' });
      //     this.recordingStream = recorder.record({
      //       sampleRate: 16000,
      //       channels: 1,
      //       device: 'plughw:1,0'
      //     }).stream()
      //     .on('error', console.error)
      //     .pipe(file);
      //     console.log('Recording for 30 seconds...');
      //     setTimeout(() => {
      //         this.stopRecording();
      //     }, 30000);
      // }
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