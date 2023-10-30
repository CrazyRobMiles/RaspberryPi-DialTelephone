const onoff = require('onoff'); //include onoff to interact with the GPIO

class InGPIO {

    /**
     * 
     * @param {number} GPIONumber 
     * @param {function} callback 
     */
    constructor(GPIONumber, callback) {
        this.GPIONumber = GPIONumber;
        this.callback = callback;
        this.init();
    }

    async delay(timeInMs) {
        return new Promise(async (kept, broken) => {
            setTimeout(async () => {
                return kept("tick");
            }, timeInMs);
        });
    }

    async test(){
        if(onoff.Gpio.accessible){
            console.log(`Test starting`);
            let count=0;
            this.gpio = new onoff.Gpio(this.GPIONumber, 'in', 'both', 
            {debounceTimeout:5}); 
            while(true){
                await this.delay(500);
                console.log(`Value:${this.gpio.readSync()} ${count}`);
                count++;
            }
        }
    }

    init() {
        console.log(`Initialising input GPIO ${this.GPIONumber}`);
        if(onoff.Gpio.accessible){
            // Create the input button
            this.gpio = new onoff.Gpio(this.GPIONumber, 'in', 'both', 
            {debounceTimeout:5}); 
            this.oldValue = this.gpio.readSync();
            // Watch the input for changes
            this.gpio.watch((error,value) => {
                if(error){
                    console.log(`GPIO ${this.GPIONumber} error ${error}`);
                }
                else {
                    if(this.oldValue != value){
                        // send the result to the callback
                        this.callback(value);
                    }
                    this.oldValue = value;
                }
            });
        }
        else{
            console.log("GPIO not accessible");
        }
    }

    getValue(){
        return this.oldValue;
    }
}

module.exports = InGPIO ;
