import { set } from '@ember/object';
import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  monitoringEnabled:   false,
  showAdvancedSection: false,

  actions: {
    showAdvanced() {
      set(this, 'showAdvancedSection', true)
    },
  },

  canRemoveRule: computed('alertRules.[]', 'isCreate', 'editRule', function() {
    const alertRules = this.alertRules || []
    const isCreate = this.isCreate
    const editRule = this.editRule

    if (alertRules.length > 1 && isCreate && !editRule) {
      return true
    }

    return false
  })
});
