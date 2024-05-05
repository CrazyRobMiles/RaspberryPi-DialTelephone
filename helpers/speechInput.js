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
        const decodeCommand = `spchcat ${messageFilename} > ${this.speechTextFile}`;

        console.log(`Performing: ${decodeCommand}`);

        exec(decodeCommand, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${error.message}`);
            this.decoding=false;
          } else {
            let message = fs.readFileSync(this.speechTextFile, 'utf8');
            console.log(`Text decoded successfuly: ${message}`);
            this.decoding=false;
            this.owner.speechDecodedSuccessfully(message);
          }
        });
    }
}

module.exports = SpeechInput;