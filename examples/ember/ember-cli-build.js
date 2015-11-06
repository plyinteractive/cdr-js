/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    // Add options here
  });
  app.import(app.bowerDirectory + '/lodash/lodash.min.js');
  app.import(app.bowerDirectory + '/underscore.inflection/lib/underscore.inflection.js');
  app.import(app.bowerDirectory + '/underscore.string/dist/underscore.string.js');
  app.import(app.bowerDirectory + '/lodash/lodash.min.js');

  app.import('vendor/js/cedar.js');
  app.import('vendor/js/cedar_admin.js');
  app.import('vendor/js/cedar_handlebars.js');
  app.import('vendor/js/cedar_iframe.js');
  app.import('vendor/css/cedar.css');
  app.import('/vendor/img/cedar-display-tools-sprite.png', {
    destDir: 'img'
  });


  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  return app.toTree();
};
