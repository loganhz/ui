import { computed } from '@ember/object';
import Component from '@ember/component';
import { filter } from 'ui/utils/search-text';
import layout from './template';
import PagedContent from 'shared/mixins/paged-content';

export const searchFields = ['displayName', 'externalIpAddress:ip', 'ipAddress:ip'];

export default Component.extend(PagedContent, {
  layout,
  nodes:        null,
  searchText:   null,
  searchFields,

  filtered: computed('nodes.[]', 'searchText', function() {
    let out = [];
    const nodes = this.nodes;

    if ( nodes ) {
      out.pushObjects(nodes.slice());
    }

    const { matches } = filter(out, this.searchText, this.searchFields);

    return matches.sortBy('displayName');
  })
});
