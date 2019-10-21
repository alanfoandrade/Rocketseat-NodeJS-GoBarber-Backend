import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';
import User from '../models/User';

class ScheduleController {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: { id: req.userId, provider: true }
    });

    if (!checkUserProvider)
      return res
        .status(401)
        .json({ error: 'Usuário não é um prestador de serviços' });

    const { date } = req.query;
    const parsedDate = parseISO(date);

    /**
     * Lista os agendamentos referentes ao Provider logado, não cancelados e
     * com horário entre o inicio e o final do dia especificado em req.query,
     * ordenados por data
     */
    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)]
        }
      },
      order: ['date']
    });

    return res.json(appointments);
  }
}

export default new ScheduleController();
