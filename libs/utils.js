
const prompt = require('prompt');

class Utils {

    prompt(text){
        const utils = this;
        return new Promise((resolve, reject) => {
            prompt.start();
            prompt.get([text], (err, result) => {
                if (err) { reject(); }
                resolve(result[text].toLowerCase());
            });
        });
    }
}

module.exports = new Utils();