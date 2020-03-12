import Component from '@ember/component';
import layout from './template';
import Provider from 'global-admin/mixins/thanos-storage-provider';

export const answers = {
  bucketName: 'thanos.objectConfig.config.bucket',
  endpoint:   'thanos.objectConfig.config.endpoint',
  accessKey:  'thanos.objectConfig.config.access_key_id',
  secretKey:  'thanos.objectConfig.config.access_key_secret'
}

const ENDPOINTS = [
  {
    value: 'oss-cn-hangzhou.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.hangzhou'
  },
  {
    value: 'oss-cn-shanghai.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.shanghai'
  }
];

export default Component.extend(Provider, {
  layout,
  answers,
  name:            'aliyunoss',
  endpointChoices: ENDPOINTS,
  endpoint:        ENDPOINTS[0].value,
});
