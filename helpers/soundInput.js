const recorder = require('node-record-lpcm16');
const fs = require('fs');

class SoundInput {
    constructor(owner) {
      this.recordingStream = null;
    }

    recordFile(soundFileName){
     
      let recordingStream = recorder.record({
        sampleRate: 16000,
        channels: 1,
        // Adjust the device according to your setup
        device: 'plughw:1,0'
      });
      
      const fileStream = fs.createWriteStream('audio.wav', { encoding: 'binary' });
      recordingStream.stream().pipe(fileStream);
      
      console.log('Recording for 5 seconds...');
      
      // Schedule the stop after 5 seconds
      setTimeout(() => {
        try {
          recordingStream.stop(); // Attempt to stop recording
          console.log('Recording stopped');
        } catch (error) {
          console.error('Error stopping recording:', error.message);
        }
      }, 5000);

      return;
      




      if(this.recordingStream===null){
          let filename = `./sounds/${soundFileName}.wav`;
          filename="test.wav";
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