import Component from '@ember/component';
import layout from './template';
import { setProperties, set, get } from '@ember/object';
import { all as PromiseAll } from 'rsvp';
import { calcStateCounts } from 'ui/mixins/state-counts';

const RESOURCES = ['workloads', 'pods', 'apps']
const QUERY_INTERVAL = 30 * 1000;

export default Component.extend({
  layout,

  project: null,
  loading: false,

  timeOutAnchor: null,

  init() {
    this._super(...arguments);

    this.load();
  },

  willDestroyElement() {
    this.clearTimeOut();
    this._super();
  },

  load(showLoading = true) {
    if ( showLoading ) {
      set(this, 'loading', true);
    }
    const project = get(this, 'project');
    const resources = [];
    const requests = [];

    RESOURCES.forEach((resource) => {
      requests.push(project.followLink(resource));
    });

    return PromiseAll(requests).then((data) => {
      data.forEach((r) => {
        if ( r.length > 0 ) {
          const stateCounts = calcStateCounts(r);

          resources.push({
            name:    r.resourceType,
            byColor: get(stateCounts, 'byColor'),
            byName:  get(stateCounts, 'byName'),
            total:   r.length
          });
        }
      });
      setProperties(this, {
        resources,
        loading: false
      });
      const timeOutAnchor = setTimeout(() => {
        this.load(false);
      }, QUERY_INTERVAL);

      set(this, 'timeOutAnchor', timeOutAnchor);
    });
  },

  clearTimeOut() {
    const timeOutAnchor = get(this, 'timeOutAnchor');

    if (timeOutAnchor){
      clearTimeout(timeOutAnchor);
      set(this, 'timeOutAnchor', timeOutAnchor);
    }
  },
});
