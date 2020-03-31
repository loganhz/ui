import Engine from 'ember-engines/engine';
import loadInitializers from 'ember-load-initializers';
import Resolver from './resolver';
import config from './config/environment';

const { modulePrefix } = config;

const Eng = Engine.extend({
  modulePrefix,
  Resolver,
  dependencies: {
    services: [
      'app',
      'clusterStore',
      'globalStore',
      'resource-actions',
      'intl',
      'modal',
      'router',
      'scope',
      'session',
      'store',
      'tooltip',
    ],
    externalRoutes: [
      'notifier',
      'authenticated.cluster.monitoring.cluster-setting',
      'authenticated.project.monitoring.project-setting',
      'global-admin.global-monitoring',
      'global-admin.alert.global-alert'
    ]
  }
});

loadInitializers(Eng, modulePrefix);

export default Eng;
