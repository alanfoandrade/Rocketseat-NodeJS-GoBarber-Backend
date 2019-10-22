import 'dotenv/config';
import Queue from './lib/Queue';

// Processa queue em um node separado,
// podendo estar em outro servidor independente
Queue.processQueue();
