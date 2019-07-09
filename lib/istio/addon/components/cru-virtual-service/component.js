import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import { get, set } from '@ember/object';
import Component from '@ember/component';
import ViewNewEdit from 'shared/mixins/view-new-edit';
import layout from './template';
import Errors from 'ui/utils/errors';
import EmberObject from '@ember/object';
import ChildHook from 'shared/mixins/child-hook';
import { flattenLabelArrays } from 'shared/mixins/manage-labels';
import { removeEmpty } from 'shared/utils/util';
export default Component.extend(ViewNewEdit, ChildHook, {
  intl: service(),

  layout,

  model:     null,

  httpRoutes: alias('model.http'),
  namespace:  alias('model.namespace'),

  didInsertElement() {
    if ( get(this, 'isNew') && get(this, 'httpRoutes.length') === 0 ) {
      this.send('addHttpRoute');
    }
  },

  actions: {
    addHttpRoute() {
      const httpRoute = EmberObject.create({
        route:    [],
        fault:    {
          abort: {},
          delay: {}
        },
        redirect: {},
        rewrite:  {},
        mirror:   {},
        retries:  {},
      });

      get(this, 'httpRoutes').pushObject(httpRoute);
    },

    removeHttpRoute(httpRoute) {
      get(this, 'httpRoutes').removeObject(httpRoute);
    },

    setLabels(labels) {
      set(this, 'model.labels', flattenLabelArrays(labels));
    },

    setHosts(hosts) {
      set(this, 'model.hosts', hosts);
    },

    setGateways(gateways) {
      set(this, 'model.gateways', gateways);
    }
  },

  willSave() {
    const intl = get(this, 'intl');

    set(this, 'model.namespaceId', get(this, 'namespace.id') || '__placeholder__');
    const self = this;
    const sup = this._super;
    let errors = [];

    if ( (get(this, 'model.hosts') || []).filter((h) => h).length === 0 )  {
      errors.pushObject(intl.t('cruVirtualService.hosts.error'));
    }

    (get(this, 'model.http') || []).forEach((route) => {
      if ( get(route, 'route.length') > 0 ) {
        (get(route, 'route') || []).forEach((destination) => {
          if ( !get(destination, 'destination.host') ) {
            errors.pushObject(intl.t('cruVirtualService.http.routes.destination.host.error'));
          }

          if ( !get(destination, 'destination.subset') ) {
            errors.pushObject(intl.t('cruVirtualService.http.routes.destination.subset.error'));
          }

          if ( !get(destination, 'weight') && get(destination, 'weight') !== 0 ) {
            errors.pushObject(intl.t('cruVirtualService.http.routes.destination.weight.error'));
          }
        })

        if ( get(route, 'redirect.uri') || get(route, 'redirect.authority') )  {
          errors.pushObject(intl.t('cruVirtualService.http.routes.redirect.error'));
        }
      }

      if ( get(route, 'match.length') > 0 ) {
        (get(route, 'match') || []).forEach((match) => {
          if ( Object.keys(match || {}).length === 0 ) {
            errors.pushObject(intl.t('cruVirtualService.http.routes.matches.error'));
          }
        })
      }
    });

    errors.pushObjects(get(this, 'namespaceErrors') || []);
    errors = errors.uniq();
    set(this, 'errors', errors);

    if ( get(errors, 'length') !== 0 ) {
      return false;
    }

    return this.applyHooks('_beforeSaveHooks').then(() => {
      set(this, 'model.namespaceId', get(this, 'namespace.id'));

      return sup.apply(self, ...arguments);
    }).catch((err) => {
      set(this, 'errors', [Errors.stringify(err)]);
    });
  },

  doSave(opt) {
    const primaryResource = get(this, 'primaryResource');
    let clone = primaryResource.clone();

    const filteredHttp = [];

    if ( get(clone, 'gateways.length') === 0 ) {
      delete clone['gateways'];
    }

    if ( get(clone, 'hosts.length') === 0 ) {
      delete clone['hosts'];
    }

    (get(clone, 'http') || []).forEach((route) => {
      let filtered = removeEmpty(route);

      filtered = removeEmpty(filtered);
      filtered = removeEmpty(filtered);
      filteredHttp.pushObject(filtered);
    });

    set(clone, 'http', filteredHttp);

    opt = opt || {};
    opt.qp = { '_replace': 'true' };

    return clone.save(opt).then((newData) => {
      return this.mergeResult(newData);
    });
  },
});
