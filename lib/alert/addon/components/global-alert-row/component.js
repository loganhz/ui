import Component from '@ember/component';
import { inject as service } from '@ember/service';
import notifierMixin from 'ui/mixins/notifier';
import { computed } from '@ember/object';

export default Component.extend(notifierMixin, {
  intl:        service(),

  model:             null,
  tagName:           '',
  bulkActions:       true,

  alertGroup: computed('groups', function() {
    const alertGroups = this.groups;
    const groupId = this.model.groupId;

    return alertGroups.findBy('id', groupId);
  }),
});
