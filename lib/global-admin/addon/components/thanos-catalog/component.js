import Component from '@ember/component';
import layout from './template';
import {
  get, computed, setProperties, set, observer
} from '@ember/object';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed'
import CrudCatalog from 'shared/mixins/crud-catalog';
import { convertToMillis } from 'shared/utils/util';
import { parseSi } from 'shared/utils/parse-unit'
import ReservationCheck from 'shared/mixins/reservation-check';
import CatalogUpgrade from 'shared/mixins/catalog-upgrade';
import C from 'ui/utils/constants';
import T from 'global-admin/utils/thanos-contants';
import Semver from 'semver';

export default Component.extend(CrudCatalog, ReservationCheck, CatalogUpgrade, {
  scope:        service(),
  settings:     service(),
  intl:         service(),
  modalService: service('modal'),

  layout,
  answers:                 null,
  updatingApp:             true,
  objectStorageEnabled:    false,
  initObjectStorageConfig: true,
  cluster:                 null,
  level:                   'cluster',
  enableClusterMonitoring: alias('cluster.enableClusterMonitoring'),
  init() {
    this._super(...arguments);

    this.initConfig();
    this.initWorkloads();

    if ( this.enabled ) {
      this.initAnswers();
    }
  },

  actions: {
    save(cb) {
      const inValid = this.validate(cb);

      if (inValid) {
        return;
      }

      const answers = {};

      this.addHiddenKeys(answers);
      this.addUserInputAnswers(answers);
      if ( !this.enableClusterMonitoring ) {
        this.enableMonitoring()
      }
      this.save(cb, answers);
      if ( !this.enabled ) {
        this.setGlobalMonitoringEnabledSetting(true);
        set(this, 'updatingApp', false)
      } else {
        set(this, 'updatingApp', true)
      }
    },

    disable(onlyThanos) {
      this._super();
      if ( !onlyThanos ) {
        this.cluster.doAction('disableMonitoring')
      }

      return this.setGlobalMonitoringEnabledSetting(false);
    },

    promptDisable() {
      const { modalService } = this

      modalService.toggleModal('modal-delete-thanos', {
        escToClose: true,
        disable:     (disableClusterMonitoring) => {
          return this.send('disable', disableClusterMonitoring)
        },
      });
    },
  },

  selectedObjectStorageProviderDidChange: observer('selectedObjectStorageProvider', function(){
    set(this, 'initObjectStorageConfig', false);
  }),

  objectStorageProvider: computed('selectedObjectStorageProvider', function() {
    return `thanos-storage-providers/${ this.selectedObjectStorageProvider }`
  }),

  globalMonitoringUrl: computed('cluster.id', function() {
    return `/k8s/clusters/${ this.cluster.id }/api/v1/namespaces/${ T.APP_NAMESPACE }/services/http:${ T.GLOBAL_MONITORING_SVC }:80/proxy/`
  }),

  grafanaUrl: computed('cluster.id', function() {
    return `/k8s/clusters/${ this.cluster.id }/api/v1/namespaces/${ T.APP_NAMESPACE }/services/http:${ T.GRAFANA_SVC }:80/proxy/`
  }),

  thanosUrl: computed('cluster.id', function() {
    return `/k8s/clusters/${ this.cluster.id }/api/v1/namespaces/${ T.APP_NAMESPACE }/services/http:${ T.THANOS_SVC }:80/proxy/`
  }),

  saveDisabled: computed('enabled', 'templateVersion', 'showCannotReuseWarning', 'grafanaWarning', 'ruleWarning', 'alertmanagerWarning', 'queryWarning', 'storeWarning', 'compactWarning', 'totalWarning', 'objectStorageEnabled', function() {
    return this.showCannotReuseWarning || !this.templateVersion || [...this.getWorkloads()].reduce((out, w) => out || (get(this, `${ w }Warning`) || false), false) || this.totalWarning
  }),

  requestsCpu: computed('config.queryRequestCpu', 'config.ruleRequestCpu', 'config.alertmanagerRequestCpu', 'config.storeRequestCpu', 'config.compactRequestCpu', 'config.grafanaRequestCpu', 'objectStorageEnabled', function() {
    return this.getWorkloads().reduce((all, w) => {
      return all + parseInt(get(this, `config.${ w }RequestCpu`) || 0)
    }, 0)
  }),

  requestsMemory: computed('config.queryRequestMemory', 'config.alertmanagerRequestMemory', 'config.ruleRequestMemory', 'config.storeRequestMemory', 'config.compactRequestMemory', 'config.grafanaRequestMemory', 'objectStorageEnabled', function() {
    return this.getWorkloads().reduce((all, w) => {
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

  clusterLevelMinCpu: computed('cluster.enableClusterMonitoring', function() {
    if (this.enableClusterMonitoring) {
      return T.GLOBAL_MONITORING_CPU
    } else {
      const allNodes = get(this, 'cluster.nodes') || [];
      const schedulableNodes = allNodes.filterBy('isUnschedulable', false);

      return  T.GLOBAL_MONITORING_CPU + T.CLUSTER_MONITORING_CPU + get(schedulableNodes, 'length') * T.NODE_EXPORTER_CPU;
    }
  }),

  clusterLevelMinMemory: computed('cluster.enableClusterMonitoring', function() {
    if (this.enableClusterMonitoring) {
      return T.GLOBAL_MONITORING_MEMORY
    } else {
      const allNodes = get(this, 'cluster.nodes') || [];
      const schedulableNodes = allNodes.filterBy('isUnschedulable', false);

      return  T.GLOBAL_MONITORING_MEMORY + T.CLUSTER_MONITORING_MEMORY + get(schedulableNodes, 'length') * T.NODE_EXPORTER_MEMORY;
    }
  }),

  showCannotReuseWarning: computed('enableClusterMonitoring', 'monitoringApp.externalIdInfo.version', function() {
    if ( !this.enableClusterMonitoring ) {
      return false;
    }

    const version = get(this, 'monitoringApp.externalIdInfo.version');

    if ( !version ) {
      return false;
    }

    const cannotReuseVersion = '0.0.7000'

    return Semver.lt(Semver.coerce(version), Semver.coerce(cannotReuseVersion))
  }),

  appName:                       T.APP_NAME,
  nsName:                        T.APP_NAMESPACE,
  templateId:                    T.APP_TEMPLATE,
  templateName:                  T.APP_TEMPLATE_NAME,
  serviceTypes:                  T.SERVICE_TYPES,
  projectLevelMinMemory:         T.DEFAULT_MIN_MEMORY,
  warningPrefix:                 T.WARNING_PREFIX,
  objectStorageProviders:        T.OBJECT_STORAGE_PROVIDERS,
  selectedObjectStorageProvider: T.AWS_S3,

  addHiddenKeys(answers) {
    T.HIDDEN_KEYS.forEach((key) => {
      const ans = get(this, 'app.answers') || {};

      if ( ans[key] ) {
        answers[key] = ans[key];
      }
    })
  },

  validate(cb) {
    const errors = this._super() || []

    if (this.objectStorageEnabled) {
      errors.pushObjects(this.config.objectStorageConfigErrors || []);
    }

    if (errors.length > 0) {
      set(this, 'errors', errors)
      cb()
    } else {
      set(this, 'errors', [])
    }

    return errors.length > 0;
  },

  populateWorkloadsAnswers(answers){
    T.WORKLOADS.map((component) => {
      (get(this, `${ component }Tolerations`) || []).map((t, index) => {
        Object.keys(t).map((key) => {
          if (t[key]) {
            answers[`${ component !== 'grafana' && component !== 'alertmanager' ? `thanos.${  component }` : component }.tolerations[${ index }].${ key }`] = t[key]
            if ( component === 'grafana' ) {
              answers[`ui.tolerations[${ index }].${ key }`] = t[key]
            }
            if ( component === 'alertmanager' ) {
              answers[`webhook-receiver.tolerations[${ index }].${ key }`] = t[key]
            }
          }
        })
      });
    });

    T.WORKLOADS.map((component) => {
      (get(this, `${ component }NodeSelectors`) || []).map((selector) => {
        let { key, value } = selector

        if (key.includes('.')) {
          key = key.replace(/\./g, '\\.')
        }
        answers[`${ component !== 'grafana' && component !== 'alertmanager' ? `thanos.${  component }` : component }.nodeSelector.${ key }`] = value
        if ( component === 'grafana' ) {
          answers[`ui.nodeSelector.${ key }`] = value
        }
        if ( component === 'alertmanager' ) {
          answers[`webhook-receiver.nodeSelector.${ key }`] = value
        }
      });
    })
  },

  populateGeneralAnswers(answers){
    const answerKeys = Object.keys(T.ANSWER_TO_CONFIG) || []

    answerKeys.map((key) => {
      const value = get(this, `config.${ T.ANSWER_TO_CONFIG[key] }`)

      if ( value === undefined || value === '' ) {
        return;
      }

      switch (key) {
      case T.THANOS_QUERY_REQUEST_CPU:
      case T.THANOS_QUERY_LIMIT_CPU:
      case T.THANOS_STORE_REQUEST_CPU:
      case T.THANOS_STORE_LIMIT_CPU:
      case T.THANOS_COMPACT_REQUEST_CPU:
      case T.THANOS_COMPACT_LIMIT_CPU:
      case T.THANOS_RULE_REQUEST_CPU:
      case T.THANOS_RULE_LIMIT_CPU:
      case T.ALERT_MANAGER_REQUEST_CPU:
      case T.ALERT_MANAGER_LIMIT_CPU:
      case T.GRAFANA_REQUEST_CPU:
      case T.GRAFANA_LIMIT_CPU:
        answers[key] = `${ value }m`
        break;
      case T.THANOS_QUERY_REQUEST_MEM:
      case T.THANOS_QUERY_LIMIT_MEM:
      case T.THANOS_RULE_REQUEST_MEM:
      case T.THANOS_RULE_LIMIT_MEM:
      case T.ALERT_MANAGER_REQUEST_MEM:
      case T.ALERT_MANAGER_LIMIT_MEM:
      case T.THANOS_STORE_REQUEST_MEM:
      case T.THANOS_STORE_LIMIT_MEM:
      case T.THANOS_COMPACT_REQUEST_MEM:
      case T.THANOS_COMPACT_LIMIT_MEM:
      case T.GRAFANA_REQUEST_MEM:
      case T.GRAFANA_LIMIT_MEM:
        answers[key] = `${ value }Mi`
        break;
      case T.GRAFANA_PV_ENABLED:
      case T.GRAFANA_DASHBOARD:
        answers[key] = `${ value }`;
        break;
      case T.GRAFANA_SC:
        answers[key] =  `${ value === null ? 'default' : value }`;
        break;
      default:
        answers[key] = value
      }
    });
    answers[T.THANOS_COMPACT_ENABLED] = !!this.objectStorageEnabled;
    answers[T.THANOS_STORE_ENABLED] = !!this.objectStorageEnabled;
    answers[T.THANOS_RULE_ENABLED] = true;
    answers[T.ALERT_MANAGER_ENABLED] = true;
    answers[T.WEBHOOK_RECEIVER_ENABLED] = true;
    answers[T.DASHBOARD_UI_SVC] = answers[T.GRAFANA_UI_SVC];
  },

  populateObjectStorageAnswers(answers) {
    if ( this.objectStorageEnabled ) {
      const provider = T.OBJECT_STORAGE_PROVIDERS.findBy('value', this.selectedObjectStorageProvider) || {};

      answers[T.OBJECT_STORAGE_PROVIDER_TYPE] = provider.provider;
      Object.keys(this.config.objectStorageConfig || {}).forEach((key) => {
        if ( provider.provider === 'GCS' && key === 'thanos.objectConfig.config.service_account' ) {
          let sa = this.config.objectStorageConfig[key].replace(/\n|\r/g, '');

          if ( sa.indexOf('\\\\n') === -1) {
            sa = `\\{${ sa.slice(1, sa.length - 1) }\\}`.replace(/\\n/g, '\\\\n');
          }
          answers[key] = sa;
        } else {
          answers[key] = this.config.objectStorageConfig[key];
        }
      });
    } else {
      this.removeKeys(answers, 'thanos.objectConfig');
      this.removeKeys(answers, 'thanos.store');
      this.removeKeys(answers, 'thanos.compact');
      this.removeKeys(this.customAnswers, 'thanos.objectConfig');
    }
  },

  addUserInputAnswers(answers) {
    this.populateGeneralAnswers(answers);
    this.populateWorkloadsAnswers(answers);
    this.populateObjectStorageAnswers(answers);
  },

  initConfig() {
    const config = {
      queryRequestCpu:           500,
      queryRequestMemory:        1024,
      queryLimitCpu:             1000,
      queryLimitMemory:          2048,
      storeRequestCpu:           500,
      storeRequestMemory:        1024,
      storeLimitCpu:             1000,
      storeLimitMemory:          2048,
      compactRequestCpu:         500,
      compactRequestMemory:      1024,
      compactLimitCpu:           1000,
      compactLimitMemory:        2048,
      grafanaRequestCpu:         100,
      grafanaRequestMemory:      256,
      grafanaLimitCpu:           300,
      grafanaLimitMemory:        512,
      ruleRequestCpu:            500,
      ruleRequestMemory:         512,
      ruleLimitCpu:              1000,
      ruleLimitMemory:           1024,
      alertmanagerRequestCpu:    500,
      alertmanagerRequestMemory: 512,
      alertmanagerLimitCpu:      1000,
      alertmanagerLimitMemory:   1024,
      enableGrafanaPersistence:  false,
      enableGrafanaSidecar:      false,
      queryServiceType:          T.CLUSTER_IP,
      grafanaServiceType:        T.CLUSTER_IP,
      grafanaPersistenceSize:    '10Gi',
      grafanaStorageClass:       null,
    }

    set(this, 'config', config);
  },

  initAnswers() {
    const answers = get(this, 'app.answers') || {};

    this.initWorkloadsAnswers(answers);
    const objectStorageAnswersArrary = this.initObjectStorageAnswers(answers);
    const generalKeys = Object.keys(answers).filter((key) => {
      if (this.objectStorageEnabled) {
        return objectStorageAnswersArrary.indexOf(key) === -1 && T.OBJECT_STORAGE_PROVIDER_TYPE !== key;
      } else {
        return true;
      }
    });

    this.initGeneralAnswers(answers, generalKeys);
  },

  initGeneralAnswers(answers, generalKeys) {
    generalKeys.filter((key = '') => {
      if (T.IGNORE_KEYS.any((ignore) => key.startsWith(ignore))){
        return false;
      }
      if (T.HIDDEN_KEYS.includes(key)) {
        return false;
      }

      return true;
    }).forEach((key = '') => {
      const answerKeys = Object.keys(T.ANSWER_TO_CONFIG) || [];

      if (answerKeys.includes(key)) {
        let value

        switch (key) {
        case T.THANOS_QUERY_REQUEST_CPU:
        case T.THANOS_QUERY_LIMIT_CPU:
        case T.THANOS_STORE_REQUEST_CPU:
        case T.THANOS_STORE_LIMIT_CPU:
        case T.THANOS_COMPACT_REQUEST_CPU:
        case T.THANOS_COMPACT_LIMIT_CPU:
        case T.THANOS_RULE_REQUEST_CPU:
        case T.THANOS_RULE_LIMIT_CPU:
        case T.ALERT_MANAGER_REQUEST_CPU:
        case T.ALERT_MANAGER_LIMIT_CPU:
        case T.GRAFANA_REQUEST_CPU:
        case T.GRAFANA_LIMIT_CPU:
          value = convertToMillis(answers[key] || '0')
          break;
        case T.THANOS_QUERY_REQUEST_MEM:
        case T.THANOS_QUERY_LIMIT_MEM:
        case T.THANOS_STORE_REQUEST_MEM:
        case T.THANOS_STORE_LIMIT_MEM:
        case T.THANOS_COMPACT_REQUEST_MEM:
        case T.THANOS_COMPACT_LIMIT_MEM:
        case T.THANOS_RULE_REQUEST_MEM:
        case T.THANOS_RULE_LIMIT_MEM:
        case T.ALERT_MANAGER_REQUEST_MEM:
        case T.ALERT_MANAGER_LIMIT_MEM:
        case T.GRAFANA_REQUEST_MEM:
        case T.GRAFANA_LIMIT_MEM:
          value = parseSi(answers[key] || '0', 1024) / 1048576
          break;
        case T.GRAFANA_PV_ENABLED:
        case T.GRAFANA_DASHBOARD:
          value = answers[key] === 'true';
          break;
        case T.GRAFANA_SC:
          value = answers[key] === 'default' ? null : answers[key]
          break;
        default:
          value = answers[key]
        }

        return set(this, `config.${ T.ANSWER_TO_CONFIG[key] }`, value)
      }
      let customAnswers = {};

      customAnswers[key] = answers[key];
      setProperties(this, { customAnswers, })
    });
  },

  initWorkloadsAnswers(answers) {
    this.initSelectorsAndTolerations(answers, 'query', T.THANOS_QUERY_NODE_SELECTOR_PREFIX, T.THANOS_QUERY_TOLERATION);
    this.initSelectorsAndTolerations(answers, 'store', T.THANOS_STORE_NODE_SELECTOR_PREFIX, T.THANOS_STORE_TOLERATION);
    this.initSelectorsAndTolerations(answers, 'compact', T.THANOS_COMPACT_NODE_SELECTOR_PREFIX, T.THANOS_COMPACT_TOLERATION);
    this.initSelectorsAndTolerations(answers, 'rule', T.THANOS_RULE_NODE_SELECTOR_PREFIX, T.THANOS_RULE_TOLERATION);
    this.initSelectorsAndTolerations(answers, 'grafana', T.GRAFANA_NODE_SELECTOR_PREFIX, T.GRAFANA_TOLERATION);
    this.initSelectorsAndTolerations(answers, 'alertmanager', T.ALERT_MANAGER_NODE_SELECTOR_PREFIX, T.ALERT_MANAGER_TOLERATION);
    this.updateCpuMemoryPreRequest()
  },

  initObjectStorageAnswers(answers) {
    set(this, 'objectStorageEnabled', answers[T.THANOS_STORE_ENABLED] === 'true');
    let objectStorageAnswersArrary = [];

    if ( this.objectStorageEnabled ) {
      const provider = T.OBJECT_STORAGE_PROVIDERS.findBy('provider', answers[T.OBJECT_STORAGE_PROVIDER_TYPE] || 'S3') || {};

      set(this, 'selectedObjectStorageProvider', provider.value || T.AWS_S3);
      const objectStorageAnswers = provider.answers || {};

      objectStorageAnswersArrary = Object.keys(objectStorageAnswers).map((key) => objectStorageAnswers[key]);

      const objectStorageConfig = {}

      objectStorageAnswersArrary.forEach((key) => {
        if (answers[key])  {
          objectStorageConfig[key] = answers[key]
        }
      });

      set(this, 'config.objectStorageConfig', objectStorageConfig);
    }

    return objectStorageAnswersArrary;
  },

  getWorkloads() {
    return this.objectStorageEnabled ? T.WORKLOADS : T.WORKLOADS_WITHOUT_STORAGE;
  },

  getEnalbedWorkloads() {
    const answers = get(this, 'app.answers') || {};

    return answers[T.THANOS_STORE_ENABLED] === 'true' ? T.WORKLOADS : T.WORKLOADS_WITHOUT_STORAGE;
  },

  doneSaving() {
    this.updateCpuMemoryPreRequest()
  },

  setGlobalMonitoringEnabledSetting(value) {
    const enabled = this.globalStore.all('setting').findBy('id', C.SETTING.GLOBAL_MONITORING_ENABLED)

    set(enabled, 'value', value)

    return enabled.save();
  },

  removeKeys(answers, prefix) {
    Object.keys(answers || {}).filter((key) => key.startsWith(prefix)).forEach((key) => delete answers[key]);
  },

  updateCpuMemoryPreRequest() {
    const answers = get(this, 'app.answers') || {};
    const workloads = answers[T.THANOS_STORE_ENABLED] === 'true' ? T.WORKLOADS_RESOURCE_KEY : T.WORKLOADS_WITHOUT_STORAGE_RESOURCE_KEY

    const preRequestsCpu = workloads.reduce((all, current) => {
      const value = answers[`${ current }.requests.cpu`]

      return value ? all + convertToMillis(value) : all
    }, 0)

    const preRequestsMemory = workloads.reduce((all, current) => {
      const value = answers[`${ current }.requests.memory`]

      return value ? all + parseSi(value) / 1048576 : all
    }, 0)

    setProperties(this, {
      preRequestsCpu,
      preRequestsMemory,
    })
  },

  enableMonitoring() {
    const resource = this.cluster;

    let answers = {}

    answers['operator-init.enabled'] = 'true';
    answers['exporter-node.enabled'] = 'true';
    answers['exporter-node.ports.metrics.port'] = '9796';
    answers['exporter-kubelets.https'] = `${ !(get(this, 'cluster.isGKE') || get(this, 'cluster.isAKS')) }`;
    answers['exporter-node.resources.limits.cpu'] = '200m';
    answers['exporter-node.resources.limits.memory'] = '200Mi';
    answers['operator.resources.limits.memory'] = '500Mi';
    answers['prometheus.retention'] = '12h';
    answers['grafana.persistence.enabled'] = 'false';
    answers['prometheus.persistence.enabled'] = 'false';
    answers['prometheus.persistence.storageClass'] = 'default';
    answers['grafana.persistence.storageClass'] = 'default';
    answers['grafana.persistence.size'] = '10Gi';
    answers['prometheus.persistence.size'] = '50Gi';
    answers['prometheus.resources.core.requests.cpu'] = '750m';
    answers['prometheus.resources.core.limits.cpu'] = '1000m';
    answers['prometheus.resources.core.requests.memory'] = '750Mi';
    answers['prometheus.resources.core.limits.memory'] = '1000Mi';
    answers['prometheus.persistent.useReleaseName'] = 'true'

    return resource.doAction('enableMonitoring', { answers })
  },

});
