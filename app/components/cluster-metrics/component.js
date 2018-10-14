import Component from '@ember/component';
import { set, get } from '@ember/object';
import { inject as service } from '@ember/service';
import layout from './template';

const fields = ['cpuFields', 'memoryFields', 'memoryPageFields', 'diskFields', 'networkPacketFields', 'storageFields', 'networkFields', 'loadFields'];

export default Component.extend({
  intl:        service(),
  scope:       service(),
  globalStore: service(),

  layout,

  duration: null,
  mode:     'cluster',

  cpuFields:           ['cpuUsage'],
  memoryFields:        ['memoryUsage'],
  memoryPageFields:    ['memoryPageIn', 'memoryPageOut'],
  diskFields:          ['diskUsage'],
  networkPacketFields: ['networkTranPacket', 'networkRevPacket', 'networkTranError', 'networkRevError', 'networkTranDrop',   'networkRevDrop'],
  storageFields:       ['storageWrite', 'storageRead'],
  networkFields:       ['networkRevTotal', 'networkTranTotal'],
  loadFields:          ['load1', 'load5', 'load15'],

  loading: false,
  stats:   {},

  actions: {
    toggle(mode)  {
      set(this, 'mode', mode);
    },

    query(options){
      const clusterId = get(this, 'scope.currentCluster.id');

      set(this, 'loading', true);

      get(this, 'globalStore').rawRequest({
        url:    `clusters/${ clusterId }/clusterstats/${ clusterId }?${ options.query }`,
        method: 'GET',
      })
        .then((xhr) => {
          if (this.isDestroyed || this.isDestroying) {
            return;
          }

          const data = JSON.parse(xhr.body);
          const series = data.series;

          series.forEach((serie) => {
            const name = get(serie, 'name');
            const points = get(serie, 'points');

            switch (name){
            case 'cluster_cpu_usage_seconds_sum_rate':
              set(this, 'stats.cpuUsage', points.map((p) => [p[0] * 100, p[1]]));
              break;
            case 'cluster_memory_usage_percent':
              set(this, 'stats.memoryUsage', points.map((p) => [p[0] * 100, p[1]]));
              break;
            case 'cluster_memory_page_in_bytes_sum_rate':
              set(this, 'stats.memoryPageIn', points.map((p) => [p[0] / 1024, p[1]]));
              break;
            case 'cluster_memory_page_out_bytes_sum_rate':
              set(this, 'stats.memoryPageOut', points.map((p) => [p[0] / 1024, p[1]]));
              break;
            case 'cluster_fs_usage_percent':
              set(this, 'stats.diskUsage', points.map((p) => [p[0] * 100, p[1]]));
              break;
            case 'cluster_network_receive_bytes_sum_rate':
              set(this, 'stats.networkRevTotal', points.map((p) => [p[0] / 1024, p[1]]));
              break;
            case 'cluster_network_receive_errors_sum_rate':
              set(this, 'stats.networkRevError', points);
              break;
            case 'cluster_network_receive_packets_dropped_sum_rate':
              set(this, 'stats.networkRevDrop', points);
              break;
            case 'cluster_network_receive_packets_sum_rate':
              set(this, 'stats.networkRevPacket', points);
              break;
            case 'cluster_network_transmit_bytes_sum_rate':
              set(this, 'stats.networkTranTotal', points.map((p) => [p[0] / 1024, p[1]]));
              break;
            case 'cluster_network_transmit_errors_sum_rate':
              set(this, 'stats.networkTranError', points);
              break;
            case 'cluster_network_transmit_packets_dropped_sum_rate':
              set(this, 'stats.networkTranDrop', points);
              break;
            case 'cluster_network_transmit_packets_sum_rate':
              set(this, 'stats.networkTranPacket', points);
              break;
            case 'cluster_disk_io_reads_bytes_sum_rate':
              set(this, 'stats.storageRead', points.map((p) => [p[0] / 1024, p[1]]));
              break;
            case 'cluster_disk_io_writes_bytes_sum_rate':
              set(this, 'stats.storageWrite', points.map((p) => [p[0] / 1024, p[1]]));
              break;
            case 'cluster_cpu_load1':
              set(this, 'stats.load1', points);
              break;
            case 'cluster_cpu_load5':
              set(this, 'stats.load5', points);
              break;
            case 'cluster_cpu_load15':
              set(this, 'stats.load15', points);
              break;
            }
          })
        }).finally(() => {
          if (this.isDestroyed || this.isDestroying) {
            return;
          }

          fields.forEach((field) => {
            const list = get(this, field);

            list.forEach((d) => {
              const data = get(this, `stats.${ d }`) || [];

              if ( get(data, 'length') === 0 ) {
                set(this, `stats.${ d }`, []);
              }
            });
          });

          set(this, 'loading', false);
          options.cb();
        });
    }
  }
});
