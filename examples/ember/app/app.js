import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import config from './config/environment';

var App;

Ember.MODEL_FACTORY_INJECTIONS = true;

new Cedar.Application({
  server: config.apiURL,
  fetch: true,
  wait: true,
  allowUnsecured: true,
  objectNameFilter: "",
  liveMode: true,
  debug: false
});


App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver
});

loadInitializers(App, config.modulePrefix);

export default App;
