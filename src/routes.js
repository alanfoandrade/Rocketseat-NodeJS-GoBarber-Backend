import { Router } from 'express';
import multer from 'multer';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import authMiddleware from './app/middlewares/authMiddleware';
import multerConfig from './config/multerConfig';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';
import ScheduleController from './app/controllers/ScheduleController';

const routes = new Router();
const upload = multer(multerConfig);

// SessionController
routes.post('/sessions', SessionController.store);

// UserController
routes.post('/users', UserController.store);
// Rotas abaixo dessa linha necessitam autenticação
routes.use(authMiddleware);
routes.get('/users/:userId?', UserController.index);
routes.put('/users', UserController.update);

// ProviderController
routes.get('/providers', ProviderController.index);

// AppointmentController
routes.get('/appointments', AppointmentController.index);
routes.post('/appointments', AppointmentController.store);

// ScheduleController
routes.get('/schedule', ScheduleController.index);

// FileController
routes.post('/files', upload.single('file'), FileController.store);

export default routes;
