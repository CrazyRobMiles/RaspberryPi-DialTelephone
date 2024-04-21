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

    asyncSay(message){

      if(this.speaking)
      {
          this.stopSpeaking();
      }

      const { exec } = require('child_process');

      const result = new Promise((resolve, reject) => {
        // Use the eSpeak command to speak the message

        const speakCommand = `espeak -v en -p40 -s120 -g5"${message}"`;

        exec(speakCommand, (error, stdout, stderr) => {
          if (error) {
            reject (`Error: ${error.message}`);
          } else {
            const speakClear = `espeak -v en -p40 -s120 -g5 -q "stop"`;
            exec(speakClear, (error, stdout, stderr) => {
              if (error) {
                reject (`Error: ${error.message}`);
              } else {
                resolve('Message spoken successfully');
            };
          });
        }
      });
    });

    return result;
  }


    stopSpeaking(){

    }
}

module.exports = Speech;