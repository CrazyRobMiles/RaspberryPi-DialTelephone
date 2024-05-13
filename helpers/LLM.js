const fetch = require('node-fetch');

class LLM{

    constructor(owner) {
        this.owner = owner;
        this.asking = false;
        this.llmURL = `http://ssdpi.local:8080/completion`;
    }

    askAI(question) {
        console.log(`Asking ${this.llmURL} the question ${question}`);

        let promptPrefix = `Transcript of a dialog, where the User interacts with an Assistant named Exchange. Exchange is helpful, kind, honest, good at writing, and never fails to answer the User's requests immediately and with precision.

User: Hello, Exchange.
Exchange: Hello. How may I help you today?
User: Please tell me the largest city in Europe.
Exchange: Sure. The largest city in Europe is Moscow, the capital of Russia.
User:`;

        question = `${promptPrefix}${question}.`;

        let req = {
            method: 'POST',
            body: JSON.stringify({
                prompt : question,
                n_predict: 256,
                temperature: 0.7,
                repeat_last_n: 256, // 0 = disable penalty, -1 = context size
                repeat_penalty: 1.18, // 1.0 = disabled
                top_k: 40, // <= 0 to use vocab size
                top_p: 0.95, // 1.0 = disabled
                min_p: 0.05, // 0 = disabled
                tfs_z: 1.0, // 1.0 = disabled
                typical_p: 1.0, // 1.0 = disabled
                presence_penalty: 0.0, // 0.0 = disabled
                frequency_penalty: 0.0, // 0.0 = disabled
                mirostat: 0, // 0/1/2
                mirostat_tau: 5, // target entropy
                mirostat_eta: 0.1, // learning rate
                grammar: '',
                n_probs: 0, // no completion_probabilities,
                image_data: [],
                stop:["User:"],
                cache_prompt: true,
                api_key: ''
            })
        };

        fetch(this.llmURL,req)
            .then(response => {
                // Check if the response is ok (status code 200-299)
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                // Parse the response body as JSON
                response.json().then( responseJSON => {
                    let answer = responseJSON.content;
                    console.log(`Asked: ${question} Received: ${answer}`);
                    this.owner.LLMReplyReceived(answer);
                });
            });
    }
}


module.exports = LLM;
