import Mixin from '@ember/object/mixin';
import { set, computed, observer } from '@ember/object';
import { alias } from '@ember/object/computed';
import pagedArray from 'ember-cli-pagination/computed/paged-array';

export default Mixin.create({
  tagName: '',

  page:    1,
  perPage: 120,

  pageCountChanged: observer('indexFrom', 'filtered.length', function() {
    // Go to the last page if we end up past the last page
    let from = this.indexFrom;
    let last = this.filtered.length;
    var perPage = this.perPage;

    if ( this.page > 1 && from > last) {
      let page = Math.ceil(last / perPage);

      set(this, 'page', page);
    }
  }),

  pagedContent: pagedArray('filtered', {
    page:    alias('parent.page'),
    perPage: alias('parent.perPage')
  }),

  indexFrom: computed('page', 'perPage', function() {
    var current =  this.page;
    var perPage =  this.perPage;

    return Math.max(0, 1 + perPage * (current - 1));
  }),

  indexTo: computed('indexFrom', 'perPage', 'filtered.length', function() {
    return Math.min(this.filtered.length, this.indexFrom + this.perPage - 1);
  }),
});
