
const prompt = require('prompt');

class Utils {

    prompt(text){
        const utils = this;
        return new Promise(function (resolve, reject) {
            prompt.start();
            prompt.get([text], function (err, result) {
                if (err) { reject(); }
                resolve(result[text].toLowerCase());
            });
        });
    }
}

module.exports = new Utils();