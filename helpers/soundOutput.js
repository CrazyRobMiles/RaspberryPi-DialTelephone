var player = require('play-sound')(opts = {})


class SoundOutput {
    constructor(owner) {
      this.playing = false;
      this.audio = null;
    }

    playFile(filename){
        if(!this.playing){
            this.playing = true;
            console.log(`Playing file: ${filename}`);
            this.audio = player.play(filename, {aplay:[]},(err)=>{console.log(`Play failed:${err}`)});
        }
    }

    stopPlayback(){
      if(this.playing){
        this.audio.kill();
        this.audio=null;
        this.playing=false;
      }
    }
}

module.exports = SoundOutput;