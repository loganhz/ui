import Route from '@ember/routing/route';
import { get } from '@ember/object';
import { hash } from 'rsvp';
import { inject as service } from '@ember/service';

export default Route.extend({
  clusterStore: service(),
  globalStore:  service(),
  growl:        service(),
  scope:        service(),

  model() {
    const store = get(this, 'store');
    const clusterStore = get(this, 'clusterStore');
    const original = this.modelFor('authenticated.project.hpa.detail').hpa;
    const project = window.l('route:application').modelFor('authenticated.project').get('project');
    let metrics = [];

    if ( project.cluster.enableClusterMonitoring ) {
      metrics = this.globalStore.rawRequest({
        url:    'monitormetrics?action=listclustermetricname&limit=-1',
        method: 'POST',
        data:   { clusterId: project.cluster.id, }
      }).then((metrics) => metrics && metrics.body && metrics.body.names)
        .catch((err = {}) => {
          get(this, 'growl').fromError(get(err, 'body.message'));
        });
    }

    return hash({
      deployments: store.findAll('deployment'),
      apiServices: clusterStore.findAll('apiService'),
      hpa:         original.clone(),
      metrics
    });
  },
});
