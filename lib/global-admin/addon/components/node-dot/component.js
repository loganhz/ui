import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import layout from './template';

export default Component.extend({
  tooltipService:  service('tooltip'),
  router:          service(),

  layout,
  model:           null,
  tagName:         'div',
  classNames:      ['vertical-middle'],
  type:            'tooltip-action-menu',
  template:        'tooltip-node-dot',

  alt: computed('model.{displayState,displayName}', function() {
    return `${ this.model.displayName  }: ${  this.model.displayState }`;
  }),

  stateIcon: computed('model.stateIcon', function() {
    if ( this.model.stateIcon === '' ) {
      return ''
    } else {
      return this.model.stateIcon
    }
  }),
  click() {
    this.router.transitionTo('authenticated.cluster.monitoring.node-detail', this.model.clusterId, this.model.id);
    this.tooltipService.hide();
  },

});
