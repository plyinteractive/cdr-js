/* jshint ignore:start */

define('ember-cdr/config/environment', ['ember'], function(Ember) {
  var prefix = 'ember-cdr';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("ember-cdr/tests/test-helper");
} else {
  require("ember-cdr/app")["default"].create({"name":"ember-cdr","version":"0.0.0+a8884df7"});
}

/* jshint ignore:end */
