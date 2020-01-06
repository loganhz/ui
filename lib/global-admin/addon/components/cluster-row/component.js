import Component from '@ember/component';
import layout from './template';

export default Component.extend({
  layout,
  model:    null,
  tagName:  '',

  actions:      {
    toggle() {
      if (this.toggle) {
        this.toggle(this.model.id);
      }
    },
  },
});
