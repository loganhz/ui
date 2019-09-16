import Component from '@ember/component';
import layout from './template';
import { computed, get } from '@ember/object';

export default Component.extend({
  layout,
  projects: null,

  rows: computed('projects', function() {
    const out = [];
    const projects = get(this, 'projects') || [];
    let dataIndex = 0;

    projects.sortBy('dispalyName').forEach((project, index) => {
      if ( index % 3 === 0 ) {
        out.push([project]);
        dataIndex++;
      } else {
        out[dataIndex - 1].push(project);
      }
    });

    return out;
  })
});
