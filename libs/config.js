
const logger = require('./logger');

class Config {
  constructor() {
    this.verbose = false;
    this.force = false;
    this.dev = false;
  }
}

module.exports = new Config();