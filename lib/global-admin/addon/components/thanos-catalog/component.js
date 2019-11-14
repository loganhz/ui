import Component from '@ember/component';
import layout from './template';
import {
  get, computed, setProperties, set, defineProperty
} from '@ember/object';
import { inject as service } from '@ember/service';
import CrudCatalog from 'shared/mixins/crud-catalog';
import { convertToMillis, ucFirst } from 'shared/utils/util';
import { parseSi } from 'shared/utils/parse-unit'
import ReservationCheck from 'shared/mixins/reservation-check';
import { alias } from '@ember/object/computed'
import CatalogUpgrade from 'shared/mixins/catalog-upgrade';

const THANOS_QUERY_REQUEST_CPU = 'thanosQuery.resources.requests.cpu'
const THANOS_QUERY_REQUEST_MEM = 'thanosQuery.resources.requests.memory'
const THANOS_QUERY_LIMIT_CPU = 'thanosQuery.resources.limits.cpu'
const THANOS_QUERY_LIMIT_MEM = 'thanosQuery.resources.limits.memory'
const THANOS_QUERY_NODE_SELECTOR_PREFIX = 'thanosQuery.nodeSelector.'
const THANOS_QUERY_TOLERATION = 'thanosQuery.tolerations'

const ANSWER_TO_CONFIG = {
  [THANOS_QUERY_REQUEST_CPU]:                  'thanosQueryRequestCpu',
  [THANOS_QUERY_REQUEST_MEM]:                  'thanosQueryRequestMemory',
  [THANOS_QUERY_LIMIT_MEM]:                    'thanosQueryLimitMemory',
  [THANOS_QUERY_LIMIT_CPU]:                    'thanosQueryLimitCpu',
}

const HIDDEN_KEYS = {}

const WORKLOADS = ['thanosQuery']
const APP_NAME = 'global-monitoring';
const APP_NAMESPACE = 'cattle-global-data';
const APP_TEMPLATE_NAME = 'thanos'
const APP_TEMPLATE = 'system-library-thanos';
const GLOBAL_MONITORING_SVC = 'access-global-monitoring';
const GRAFANA_SVC = 'access-grafana';
const THANOS_SVC = 'access-thanos';

export default Component.extend(CrudCatalog, ReservationCheck, CatalogUpgrade, {
  scope:        service(),
  intl:         service(),

  layout,

  answers:      null,
  appName:      APP_NAME,
  nsName:       APP_NAMESPACE,
  templateId:   APP_TEMPLATE,
  templateName: APP_TEMPLATE_NAME,

  level:                   alias('scope.currentPageScope'),
  cluster:                 alias('scope.currentCluster'),

  init() {
    this._super(...arguments);

    this.initConfig();
    this.initWorkloads();

    if ( get(this, 'enabled') ) {
      this.initAnswers();
    }
  },

  actions: {
    save(cb) {
      set(this, 'errors', [])
      const errors = this.validate() || []

      if (errors.length > 0) {
        set(this, 'errors', errors)
        cb()

        return
      }

      let answers = { ...HIDDEN_KEYS,  };

      const answerKeys = Object.keys(ANSWER_TO_CONFIG) || []

      answerKeys.map((key) => {
        const value = get(this, `config.${ ANSWER_TO_CONFIG[key] }`)

        if ( value === undefined || value === '' ) {
          return;
        }

        switch (key) {
        case THANOS_QUERY_REQUEST_CPU:
        case THANOS_QUERY_LIMIT_CPU:
          answers[key] = `${ value }m`
          break;
        case THANOS_QUERY_REQUEST_MEM:
        case THANOS_QUERY_LIMIT_MEM:
          answers[key] = `${ value }Mi`
          break;
        default:
          answers[key] = value
        }
      });

      WORKLOADS.map((component) => {
        (get(this, `${ component }Tolerations`) || []).map((t, index) => {
          Object.keys(t).map((key) => {
            if (t[key]) {
              answers[`${ component }.tolerations[${ index }].${ key }`] = t[key]
            }
          })
        });
      });

      WORKLOADS.map((component) => {
        (get(this, `${ component }NodeSelectors`) || []).map((selector) => {
          let { key, value } = selector

          if (key.includes('.')) {
            key = key.replace(/\./g, '\\.')
          }
          answers[`${ component }.nodeSelector.${ key }`] = value
        });
      })

      this.save(cb, answers);
    },
  },

  globalMonitoringUrl: computed('cluster.id', function() {
    return `/k8s/clusters/${ get(this, 'cluster.id') }/api/v1/namespaces/${ APP_NAMESPACE }/services/http:${ GLOBAL_MONITORING_SVC }:80/proxy/`
  }),

  grafanaUrl: computed('cluster.id', function() {
    return `/k8s/clusters/${ get(this, 'cluster.id') }/api/v1/namespaces/${ APP_NAMESPACE }/services/http:${ GRAFANA_SVC }:80/proxy/`
  }),

  thanosUrl: computed('cluster.id', function() {
    return `/k8s/clusters/${ get(this, 'cluster.id') }/api/v1/namespaces/${ APP_NAMESPACE }/services/http:${ THANOS_SVC }:80/proxy/`
  }),

  saveDisabled: computed('enabled', 'monitoringWarning', 'thanosQueryWarning', function() {
    return [...WORKLOADS].reduce((out, w) => out || (get(this, `${ w }Warning`) || false), false) || (get(this, 'monitoringWarning') || false)
  }),

  monitoringWarning: computed('insufficientCpu', 'insufficientMemory', function() {
    let {
      insufficientCpu, insufficientMemory, intl, minCpu, minMemory, enabled
    } = this
    const prefix = 'globalMonitoringPage.insufficientSize.total'
    const action = enabled ? 'update' : 'enable'

    if (insufficientCpu && insufficientMemory) {
      return intl.t(`${ prefix }.all`, {
        minCpu,
        minMemory,
        action,
      })
    } else if (insufficientCpu) {
      return intl.t(`${ prefix }.cpu`, {
        minCpu,
        action,
      })
    } else if (insufficientMemory) {
      return intl.t(`${ prefix }.memory`, {
        minMemory,
        action,
      })
    }
  }),

  enabled: computed('app.state', function() {
    return !!get(this, 'app') && get(this, 'app.state') !== 'removing'
  }),

  nsNeedMove: computed('namespace.projectId', 'project.id', function() {
    const { namespace = {}, project = {} } = this

    return namespace.projectId !== project.id
  }),

  requestsCpu: computed('config.thanosQueryRequestCpu', function() {
    return WORKLOADS.reduce((all, w) => {
      return all + parseInt(get(this, `config.${ w }RequestCpu`) || 0)
    }, 0)
  }),

  requestsMemory: computed('config.thanosQueryRequestMemory', function() {
    return WORKLOADS.reduce((all, w) => {
      return all + parseInt(get(this, `config.${ w }RequestMemory`) || 0)
    }, 0)
  }),

  chartVersions: computed('availableVersions', 'templateLables', function() {
    const { availableVersions = [], templateLables = {} } = this

    return availableVersions.map((v) => {
      const key = `rancher.thanos.v${ v.value }`

      return {
        label: `${ v.label } (Thanos ${ templateLables[key] })`,
        value: v.value,
      }
    })
  }),

  validate() {
    const errors = [];

    WORKLOADS.map((w) => {
      errors.pushObjects(this.validateLimitAndRequest(w))
    })

    return errors
  },

  initConfig() {
    const config = {
      thanosQueryRequestCpu:             500,
      thanosQueryRequestMemory:          2048,
      thanosQueryLimitCpu:               1000,
      thanosQueryLimitMemory:            4096,
    }

    set(this, 'config', config);
  },

  initWorkloads() {
    WORKLOADS.map((w) => {
      defineProperty(this, `${ w }SchedulableNodes`, computed(`${ w }NodeSelectors.[]`, 'cluster.nodes.@each.{allocatable,requested}', () => {
        return this.getSchedulableNodes(w)
      }));

      defineProperty(this, `insufficient${ ucFirst(w) }Cpu`, computed(`${ w }SchedulableNodes.@each.{allocatable,requested}`, `config.${ w }RequestCpu`, 'cluster.nodes.@each.{allocatable,requested}', () => {
        return this.getComponentInsufficient(w, 'cpu')
      }))

      defineProperty(this, `insufficient${ ucFirst(w) }Memory`, computed(`${ w }SchedulableNodes.@each.{allocatable,requested}`, `config.${ w }RequestMemory`, 'cluster.nodes.@each.{allocatable,requested}', () => {
        return this.getComponentInsufficient(w, 'memory')
      }))

      defineProperty(this, `${ w }Warning`, computed(`insufficient${ ucFirst(w) }Cpu`, `insufficient${ ucFirst(w) }Memory`, () => {
        return this.getComponentWarning(w)
      }))
    });
  },

  initAnswers() {
    let customAnswers = {};

    const answers = get(this, 'app.answers') || {};
    const answerKeys = Object.keys(ANSWER_TO_CONFIG) || []

    const thanosQueryNodeSelector = {}

    Object.keys(answers).filter((key) => key.startsWith(THANOS_QUERY_NODE_SELECTOR_PREFIX) ).map((k) => {
      let value = answers[k] || '';
      const key = k.replace(THANOS_QUERY_NODE_SELECTOR_PREFIX, '').replace(/\\\./g, '.')

      thanosQueryNodeSelector[key] = value
    });

    const thanosQueryTolerations = []

    const thanosQueryTolerationKeys = Object.keys(answers).filter((key) => key.startsWith(THANOS_QUERY_TOLERATION) )
    const thanosQueryTolerationIndexs = thanosQueryTolerationKeys.map((k) => {
      return k.replace(`${ THANOS_QUERY_TOLERATION }[`, '').split('].').get('firstObject')
    }).uniq()

    thanosQueryTolerationIndexs.map((idx) => {
      thanosQueryTolerations.pushObject({
        key:               answers[`${ THANOS_QUERY_TOLERATION }[${ idx }].key`] || '',
        operator:          answers[`${ THANOS_QUERY_TOLERATION }[${ idx }].operator`] || '',
        value:             answers[`${ THANOS_QUERY_TOLERATION }[${ idx }].value`] || '',
        effect:            answers[`${ THANOS_QUERY_TOLERATION }[${ idx }].effect`] || '',
        tolerationSeconds: answers[`${ THANOS_QUERY_TOLERATION }[${ idx }].tolerationSeconds`] || '',
      })
    })

    this.updateCpuMemoryPreRequest()

    setProperties(this, {
      thanosQueryNodeSelector,
      thanosQueryTolerations,
    })

    this.initMembers()

    Object.keys(answers).forEach((key = '') => {
      if (key.startsWith(THANOS_QUERY_NODE_SELECTOR_PREFIX)
          || key.startsWith(`${ THANOS_QUERY_TOLERATION }`)
      ) {
        return
      }

      if (Object.keys(HIDDEN_KEYS).includes(key)) {
        return
      }

      if (answerKeys.includes(key)) {
        let value

        switch (key) {
        case THANOS_QUERY_REQUEST_CPU:
        case THANOS_QUERY_LIMIT_CPU:
          value = convertToMillis(answers[key] || '0')
          break;
        case THANOS_QUERY_REQUEST_MEM:
        case THANOS_QUERY_LIMIT_MEM:
          value = parseSi(answers[key] || '0', 1024) / 1048576
          break;
        default:
          value = answers[key]
        }

        return set(this, `config.${ ANSWER_TO_CONFIG[key] }`, value)
      }

      customAnswers[key] = answers[key];
      setProperties(this, { customAnswers, })
    });
  },

  getEnalbedWorkloads() {
    return WORKLOADS;
  },

  doneSaving() {
    this.updateCpuMemoryPreRequest()
  },
});
