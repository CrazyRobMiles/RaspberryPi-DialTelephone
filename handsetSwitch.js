const InGPIO = require('./helpers/InGPIO');

class HandsetSwitch{

    constructor(owner) {
        this.owner = owner;
        this.handsetGPIO = new InGPIO(18, (value) => {
            if(value == 1){
                owner.handsetPickedUp();
            }
            else {
                owner.handsetPutDown();
            }
        });

    }

    handsetOnPhone(){
        return this.handsetGPIO.getValue()==0;
    }

    handsetOffPhone(){
        return this.handsetGPIO.getValue()!=0;
    }
}

module.exports = HandsetSwitch;
