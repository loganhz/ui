import Controller from '@ember/controller';
import { alias } from '@ember/object/computed'
import { inject as service } from '@ember/service';

export default Controller.extend({
  settings:  service(),
  pageScope: 'global',
  alerts:    alias('model.alerts'),
  notifiers: alias('model.notifiers'),
});
