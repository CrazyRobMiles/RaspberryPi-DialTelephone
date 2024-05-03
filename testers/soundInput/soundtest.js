const Speech = require('./speech');
const recorder = require('node-record-lpcm16');
const fs = require('fs');

speech = new Speech(this);

console.log("Test starting");

console.log("starting recording");


let recordingStream = recorder.record({
sampleRate: 16000,
channels: 1,
device: 'plughw:1,0'
});

const fileStream = fs.createWriteStream('mictest4.wav', { encoding: 'binary' });
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
}, 8000);


// speech.asyncSay("hello world this is a long message which should complete before the recording").then((msg)=> {
    
//     console.log(msg);

// });



