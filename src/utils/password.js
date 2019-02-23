const randomWord = require('random-words');

module.exports.generate = function generate() {
  let word = randomWord();
  while(word.length<8) {
    word = `${word}-${randomWord()}`;
  }
  return word.toLowerCase();
}
