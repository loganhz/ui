import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { inject as service } from '@ember/service';

export default Route.extend({
  globalStore: service(),

  model() {
    const gs = this.globalStore;
    const notifiers = gs.find('notifier');
    const alerts = gs.find('globalAlertRule');
    const groups = gs.find('globalAlertGroup');

    return hash({
      alerts,
      notifiers,
      groups,
    });
  },
});
