const { exec } = require('child_process');

async function delay(timeInMs) {
    return new Promise(async (kept, broken) => {
        setTimeout(async () => {
            return kept("tick");
        }, timeInMs);
    });
}


// Function to record audio using SoX
function recordAudio(outputFile, duration) {
    return new Promise((resolve, reject) => {
        // Record audio with SoX
        const command = `rec -c 1 -r 44100 -e signed-integer -b 16 ${outputFile} trim 0 ${duration}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(outputFile);
            }
        });
    });
}

function saySomething(message){
        const { exec } = require('child_process');

        // Use the eSpeak command to speak the message
        const speakCommand = `espeak -v en -p40 -s120 -g5  "${message}"`;

        exec(speakCommand, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${error.message}`);
          } else {
            console.log('Message spoken successfully');
          }
        });
    }


// Example usage: Record 5 seconds of audio
const outputFile = 'test.wav';
const duration = 5; // in seconds

saySomething("hello world");
delay(5000).then(() =>{
    recordAudio(outputFile, duration)
    .then(file => console.log(`Audio recorded to ${file}`))
    .catch(error => console.error('Error recording audio:', error));
});

