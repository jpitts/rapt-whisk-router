casper.echo('Hello, casperjs!');

casper.test.begin('Casperjs test', 1, function suite(test) {
  test.assert(true);
  test.done();
});

