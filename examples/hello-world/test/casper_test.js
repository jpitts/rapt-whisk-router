
/*

  Casperjs installation test.

  Usage: casperjs test casper_test.js

*/

casper.echo('Hello, casperjs!');

casper.test.begin('Casperjs test', 1, function suite(test) {
  test.assert(true);
  test.done();
});

