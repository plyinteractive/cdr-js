define('ember-cdr/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'ember-cdr/config/environment'], function (exports, Ember, Resolver, loadInitializers, config) {

  'use strict';

  var App;

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  new Cedar.Application({
    server: config['default'].apiURL,
    fetch: true,
    wait: true,
    allowUnsecured: true,
    objectNameFilter: "",
    liveMode: true,
    debug: false
  });

  App = Ember['default'].Application.extend({
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix,
    Resolver: Resolver['default']
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});