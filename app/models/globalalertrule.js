import Resource from '@rancher/ember-api-store/models/resource';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Alert from 'ui/mixins/model-alert';
import C from 'ui/utils/constants';

const globalAlertRule = Resource.extend(Alert, {
  intl: service(),

  type: 'globalAlertRule',

  _targetType: 'metric',

  canClone: true,
  canEdit:  true,

  targetType: 'metric',

  displayTargetType: computed('targetType', function() {
    return this.intl.t('alertPage.targetTypes.metric');
  }),

  displayCondition: computed('targetType', 'metricRule.{expression,comparison,thresholdValue}', function() {
    const metricRule = this.metricRule

    return metricRule.comparison === C.ALERTING_COMPARISON.HAS_VALUE ? this.intl.t(`alertPage.comparison.${ metricRule.comparison }`) : `${ this.intl.t(`alertPage.comparison.${ metricRule.comparison }`) } ${ metricRule.thresholdValue }`
  }),

  actions: {
    clone() {
      this.router.transitionTo('global-admin.alert.new-rule', this.groupId, { queryParams: { id: this.id,  } });
    },
    edit() {
      this.router.transitionTo('global-admin.alert.edit-rule', this.groupId, this.id);
    },
  },

});

export default globalAlertRule;
