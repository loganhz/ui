import { answers as s3Answers }  from 'global-admin/components/thanos-storage-providers/aws-s3/component';
import { answers as ossAnswers }  from 'global-admin/components/thanos-storage-providers/aliyun-oss/component';
import { answers as gcsAnswers }  from 'global-admin/components/thanos-storage-providers/gcs/component';
import { answers as cosAnswers } from 'global-admin/components/thanos-storage-providers/tencentcloud-cos/component';
import { answers as azureAnswers } from 'global-admin/components/thanos-storage-providers/azure/component';
var T = {}

T.WORKLOADS_RESOURCE_KEY = ['grafana.resources.core',
  'thanos.rule.resources',
  'alertmanager.resources',
  'thanos.query.resources',
  'thanos.compact.resources',
  'thanos.store.resources'
]
T.WORKLOADS_WITHOUT_STORAGE_RESOURCE_KEY = [
  'grafana.resources.core',
  'thanos.query.resources',
  'thanos.rule.resources',
  'alertmanager.resources',
]
T.THANOS_QUERY_REQUEST_CPU = 'thanos.query.resources.requests.cpu'
T.THANOS_QUERY_REQUEST_MEM = 'thanos.query.resources.requests.memory'
T.THANOS_QUERY_LIMIT_CPU = 'thanos.query.resources.limits.cpu'
T.THANOS_QUERY_LIMIT_MEM = 'thanos.query.resources.limits.memory'
T.THANOS_QUERY_NODE_SELECTOR_PREFIX = 'thanos.query.nodeSelector.'
T.THANOS_QUERY_TOLERATION = 'thanos.query.tolerations'
T.THANOS_QUERY_UI_SVC = 'thanos.query.service.type'
T.THANOS_STORE_REQUEST_CPU = 'thanos.store.resources.requests.cpu'
T.THANOS_STORE_REQUEST_MEM = 'thanos.store.resources.requests.memory'
T.THANOS_STORE_LIMIT_CPU = 'thanos.store.resources.limits.cpu'
T.THANOS_STORE_LIMIT_MEM = 'thanos.store.resources.limits.memory'
T.THANOS_STORE_NODE_SELECTOR_PREFIX = 'thanos.store.nodeSelector.'
T.THANOS_STORE_TOLERATION = 'thanos.store.tolerations'
T.THANOS_STORE_ENABLED = 'thanos.store.enabled'
T.THANOS_COMPACT_REQUEST_CPU = 'thanos.compact.resources.requests.cpu'
T.THANOS_COMPACT_REQUEST_MEM = 'thanos.compact.resources.requests.memory'
T.THANOS_COMPACT_LIMIT_CPU = 'thanos.compact.resources.limits.cpu'
T.THANOS_COMPACT_LIMIT_MEM = 'thanos.compact.resources.limits.memory'
T.THANOS_COMPACT_NODE_SELECTOR_PREFIX = 'thanos.compact.nodeSelector.'
T.THANOS_COMPACT_TOLERATION = 'thanos.compact.tolerations'
T.THANOS_COMPACT_ENABLED =  'thanos.compact.enabled'
T.THANOS_RULE_ENABLED =  'thanos.rule.enabled'
T.THANOS_RULE_REQUEST_CPU = 'thanos.rule.resources.requests.cpu'
T.THANOS_RULE_REQUEST_MEM = 'thanos.rule.resources.requests.memory'
T.THANOS_RULE_LIMIT_CPU = 'thanos.rule.resources.limits.cpu'
T.THANOS_RULE_LIMIT_MEM = 'thanos.rule.resources.limits.memory'
T.THANOS_RULE_NODE_SELECTOR_PREFIX = 'thanos.rule.nodeSelector.'
T.THANOS_RULE_TOLERATION = 'thanos.rule.tolerations'
T.ALERT_MANAGER_ENABLED =  'alertmanager.enabled'
T.ALERT_MANAGER_REQUEST_CPU = 'alertmanager.resources.requests.cpu'
T.ALERT_MANAGER_REQUEST_MEM = 'alertmanager.resources.requests.memory'
T.ALERT_MANAGER_LIMIT_CPU = 'alertmanager.resources.limits.cpu'
T.ALERT_MANAGER_LIMIT_MEM = 'alertmanager.resources.limits.memory'
T.ALERT_MANAGER_NODE_SELECTOR_PREFIX = 'alertmanager.nodeSelector.'
T.ALERT_MANAGER_TOLERATION = 'alertmanager.tolerations'
T.WEBHOOK_RECEIVER_ENABLED = 'webhook-receiver.enabled'
T.WEBHOOK_RECEIVER_NODE_SELECTOR_PREFIX = 'webhook-receiver.nodeSelector.'
T.WEBHOOK_RECEIVER_TOLERATION = 'webhook-receiver.tolerations'
T.GRAFANA_REQUEST_CPU = 'grafana.resources.core.requests.cpu'
T.GRAFANA_REQUEST_MEM = 'grafana.resources.core.requests.memory'
T.GRAFANA_LIMIT_CPU = 'grafana.resources.core.limits.cpu'
T.GRAFANA_LIMIT_MEM = 'grafana.resources.core.limits.memory'
T.GRAFANA_NODE_SELECTOR_PREFIX = 'grafana.nodeSelector.'
T.GRAFANA_TOLERATION = 'grafana.tolerations'
T.GRAFANA_PV_ENABLED = 'grafana.persistence.enabled'
T.GRAFANA_DASHBOARD = 'grafana.sidecar.dashboards.enabled'
T.GRAFANA_PV_SIZE = 'grafana.persistence.size'
T.GRAFANA_SC = 'grafana.persistence.storageClass'
T.GRAFANA_UI_SVC = 'grafana.service.type'
T.OBJECT_STORAGE_PROVIDER_TYPE = 'thanos.objectConfig.type'
T.DASHBOARD_UI_NODE_SELECTOR_PREFIX = 'ui.nodeSelector.'
T.DASHBOARD_UI_TOLERATION = 'ui.tolerations'
T.DASHBOARD_UI_SVC = 'ui.service.type'
T.CLUSTER_IP = 'ClusterIP'
T.NODE_PORT = 'NodePort'
T.LOAD_BALANCER = 'LoadBalancer'
T.ANSWER_TO_CONFIG = {
  [T.THANOS_QUERY_REQUEST_CPU]:   'queryRequestCpu',
  [T.THANOS_QUERY_REQUEST_MEM]:   'queryRequestMemory',
  [T.THANOS_QUERY_LIMIT_MEM]:     'queryLimitMemory',
  [T.THANOS_QUERY_LIMIT_CPU]:     'queryLimitCpu',
  [T.THANOS_STORE_REQUEST_CPU]:   'storeRequestCpu',
  [T.THANOS_STORE_REQUEST_MEM]:   'storeRequestMemory',
  [T.THANOS_STORE_LIMIT_MEM]:     'storeLimitMemory',
  [T.THANOS_STORE_LIMIT_CPU]:     'storeLimitCpu',
  [T.THANOS_COMPACT_REQUEST_CPU]: 'compactRequestCpu',
  [T.THANOS_COMPACT_REQUEST_MEM]: 'compactRequestMemory',
  [T.THANOS_COMPACT_LIMIT_MEM]:   'compactLimitMemory',
  [T.THANOS_COMPACT_LIMIT_CPU]:   'compactLimitCpu',
  [T.THANOS_QUERY_UI_SVC]:        'queryServiceType',
  [T.THANOS_RULE_REQUEST_CPU]:    'ruleRequestCpu',
  [T.THANOS_RULE_REQUEST_MEM]:    'ruleRequestMemory',
  [T.THANOS_RULE_LIMIT_MEM]:      'ruleLimitMemory',
  [T.THANOS_RULE_LIMIT_CPU]:      'ruleLimitCpu',
  [T.ALERT_MANAGER_REQUEST_CPU]:  'alertmanagerRequestCpu',
  [T.ALERT_MANAGER_REQUEST_MEM]:  'alertmanagerRequestMemory',
  [T.ALERT_MANAGER_LIMIT_MEM]:    'alertmanagerLimitMemory',
  [T.ALERT_MANAGER_LIMIT_CPU]:    'alertmanagerLimitCpu',
  [T.GRAFANA_REQUEST_CPU]:        'grafanaRequestCpu',
  [T.GRAFANA_REQUEST_MEM]:        'grafanaRequestMemory',
  [T.GRAFANA_LIMIT_MEM]:          'grafanaLimitMemory',
  [T.GRAFANA_LIMIT_CPU]:          'grafanaLimitCpu',
  [T.GRAFANA_PV_ENABLED]:         'enableGrafanaPersistence',
  [T.GRAFANA_DASHBOARD]:          'enableGrafanaSidecar',
  [T.GRAFANA_UI_SVC]:             'grafanaServiceType',
  [T.GRAFANA_PV_SIZE]:            'grafanaPersistenceSize',
  [T.GRAFANA_SC]:                 'grafanaStorageClass',
}
T.HIDDEN_KEYS = [
  'clusterIds',
  'rancherHost',
  'token',
  'apiToken',
  'ui.service.type',
  T.THANOS_COMPACT_ENABLED,
  T.THANOS_STORE_ENABLED,
  T.ALERT_MANAGER_ENABLED,
  T.THANOS_RULE_ENABLED,
  T.WEBHOOK_RECEIVER_ENABLED,
]
T.WORKLOADS = [
  'query',
  'grafana',
  'store',
  'compact',
  'rule',
  'alertmanager',
];
T.WORKLOADS_WITHOUT_STORAGE = [
  'query',
  'grafana',
  'rule',
  'alertmanager',
];
T.APP_NAME = 'global-monitoring';
T.APP_NAMESPACE = 'cattle-global-data';
T.APP_TEMPLATE_NAME = 'rancher-thanos'
T.APP_TEMPLATE = 'system-library-rancher-thanos';
T.GLOBAL_MONITORING_SVC = 'access-dashboard';
T.GRAFANA_SVC = 'access-grafana';
T.THANOS_SVC = 'access-thanos';
T.DEFAULT_MIN_MEMORY = 512;
T.WARNING_PREFIX = 'globalMonitoringPage.insufficientSize.total'
T.SERVICE_TYPES = [
  {
    label: 'globalMonitoringPage.svc.clusterIp',
    value: T.CLUSTER_IP
  },
  {
    label: 'globalMonitoringPage.svc.nodePort',
    value: T.NODE_PORT
  },
  {
    label: 'globalMonitoringPage.svc.loadBalancer',
    value: T.LOAD_BALANCER
  }
];
T.AWS_S3 = 'aws-s3';
T.OBJECT_STORAGE_PROVIDERS = [
  {
    label:    'globalMonitoringPage.store.s3.label',
    value:    T.AWS_S3,
    provider: 'S3',
    answers:  s3Answers,
  },
  {
    label:    'globalMonitoringPage.store.azure.label',
    value:    'azure',
    provider: 'AZURE',
    answers:  azureAnswers,
  },
  {
    label:    'globalMonitoringPage.store.gcs.label',
    value:    'gcs',
    provider: 'GCS',
    answers:  gcsAnswers,
  },
  {
    label:    'globalMonitoringPage.store.aliyunoss.label',
    value:    'aliyun-oss',
    provider: 'ALIYUNOSS',
    answers:  ossAnswers,
  },
  {
    label:    'globalMonitoringPage.store.tencentcloudcos.label',
    value:    'tencentcloud-cos',
    provider: 'COS',
    answers:  cosAnswers,
  }
];
T.IGNORE_KEYS = [
  T.THANOS_QUERY_NODE_SELECTOR_PREFIX,
  T.THANOS_QUERY_TOLERATION,
  T.THANOS_STORE_NODE_SELECTOR_PREFIX,
  T.THANOS_STORE_TOLERATION,
  T.THANOS_COMPACT_NODE_SELECTOR_PREFIX,
  T.THANOS_COMPACT_TOLERATION,
  T.THANOS_RULE_NODE_SELECTOR_PREFIX,
  T.THANOS_RULE_TOLERATION,
  T.ALERT_MANAGER_NODE_SELECTOR_PREFIX,
  T.ALERT_MANAGER_TOLERATION,
  T.WEBHOOK_RECEIVER_NODE_SELECTOR_PREFIX,
  T.WEBHOOK_RECEIVER_TOLERATION,
  T.GRAFANA_NODE_SELECTOR_PREFIX,
  T.GRAFANA_TOLERATION,
  T.DASHBOARD_UI_NODE_SELECTOR_PREFIX,
  T.DASHBOARD_UI_TOLERATION
];

T.GLOBAL_MONITORING_CPU = 500;
T.GLOBAL_MONITORING_MEMORY  = 500;

T.NODE_EXPORTER_CPU = 100;
T.NODE_EXPORTER_MEMORY = 30;

const MONITORING_MIN_CPU = 650
const MONITORING_MIN_MEMORY = 650
const PROMETHEUS_DEFAULT_CPU = 750
const PROMETHEUS_DEFAULT_MEMORY = 750

T.CLUSTER_MONITORING_CPU = PROMETHEUS_DEFAULT_CPU + MONITORING_MIN_CPU;
T.CLUSTER_MONITORING_MEMORY = PROMETHEUS_DEFAULT_MEMORY + MONITORING_MIN_MEMORY;

export default T;
