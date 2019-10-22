import BeeQueue from 'bee-queue';
import CancellationMail from '../app/jobs/CancellationMail';
import redisConfig from '../config/redisConfig';

const jobs = [CancellationMail];

class Queue {
  constructor() {
    this.queues = {};

    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      /**
       * key = nome da fila no array de jobs
       * bee = a lista de jobs armazenada no banco
       * handle = dados de cada job passados no metodo add(queue,job) abaixo
       * para handle(data) do job CancellationMail
       * Adiciona cada job em this.queue contendo a fila armazenada no banco
       * e o método handle
       */
      this.queues[key] = {
        bee: new BeeQueue(key, {
          redis: redisConfig
        }),
        handle
      };
    });
  }

  /**
   * Adiciona à fila queue os dados passados em job
   */
  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  /**
   * key = nome da fila no array de jobs
   * Executa o metodo handle para cada job da fila
   */
  processQueue() {
    jobs.forEach(job => {
      // Extrai apenas bee e handle de cada job
      const { bee, handle } = this.queues[job.key];

      bee.process(handle);
    });
  }
}

export default new Queue();
