const fs = require('fs');

class SpeechInput{
    constructor(owner) {
        this.owner = owner;
        this.deoding = false;
        this.speechTextFile = './recordings/message.txt';
    }
    
    startSpeechDecode (messageFilename){

        if(this.deoding)
        {
          console.log("Speech decode called when already decoding");
          return;
        }

        this.decoding = true;

        const { exec } = require('child_process');

        // Use the spchcat command to decode the message
        const decodeCommand = `spchcat --json ${messageFilename} > ${this.speechTextFile}`;

        console.log(`Performing: ${decodeCommand}`);

        exec(decodeCommand, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${error.message}`);
            this.decoding=false;
          } else {
            let jsonMessage = fs.readFileSync(this.speechTextFile, 'utf8');
            const message = JSON.parse(jsonMessage);
            console.dir(message);
            const text = message.words.map(w => w.word).join(' ');
            console.log(`Text decoded successfuly: ${text}`);
            
            this.decoding=false;
            this.owner.speechDecodedSuccessfully(text);
          }
        });
    }
}

module.exports = SpeechInput;