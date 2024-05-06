const fetch = require('node-fetch');

class LLM{

    constructor(owner) {
        this.owner = owner;
        this.asking = false;
        this.llmURL = `http://ssdpi.local:8080/completion`;
    }

    askAI(question) {
        console.log(`Asking ${this.llmURL} the question ${question}`);

        let promptPrefix = `This is a conversation between User and Llama, a friendly chatbot. Llama is helpful, kind, honest, good at writing, and never fails to answer any requests immediately and with precision.`;

        question = `${promptPrefix}\n\n${question}.`;

        let req = {
            method: 'POST',
            body: JSON.stringify({
                prompt : question,
                n_predict: 400,
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
