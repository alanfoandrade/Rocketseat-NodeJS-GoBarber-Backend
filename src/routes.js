import { Router } from 'express';

const routes = new Router();

routes.get('/', (req, res) => {z
  return res.json({ message: 'Hello sss' });
});

export default routes;
