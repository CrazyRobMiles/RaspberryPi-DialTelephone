class Speech{
    constructor(owner) {
        this.owner = owner;
        this.speaking = false;
    }
    
    say(message){
        if(this.speaking)
        {
            this.stopSpeaking();
        }

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

    stopSpeaking(){

    }
}

module.exports = Speech;