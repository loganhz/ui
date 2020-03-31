import Component from '@ember/component';
import ModalBase from 'ui/mixins/modal-base';
import layout from './template';

export default Component.extend(ModalBase, {
  layout,
  classNames:     ['medium-modal'],

  onlyThanos: true,

  didRender() {
    setTimeout(() => {
      try {
        this.$('BUTTON')[0].focus();
      } catch (e) {}
    }, 500);
  },

  actions: {
    confirm() {
      this.modalService.modalOpts.disable(this.onlyThanos).finally(() => this.send('cancel'));
    },
  },
});
