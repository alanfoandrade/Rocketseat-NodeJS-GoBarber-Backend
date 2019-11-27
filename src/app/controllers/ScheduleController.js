import {
  format,
  parseISO,
  setHours,
  setMinutes,
  setSeconds,
  isAfter,
} from 'date-fns';
import { Op } from 'sequelize';

import Appointment from '../models/Appointment';
import User from '../models/User';

class ScheduleController {
  async index(req, res) {
    const isProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!isProvider)
      return res.status(401).json({ error: 'Não é um prestador de serviços' });

    const { date, page = 1 } = req.query;

    const parsedDate = parseISO(date);

    if (!date) {
      const appointments = await Appointment.findAll({
        where: {
          provider_id: req.userId,
          canceled_at: null,
        },
        order: ['date'],
        attributes: ['id', 'date'],
        limit: 20,
        offset: (page - 1) * 20,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name'],
          },
        ],
      });
      return res.json(appointments);
    }

    /**
     * Lista os agendamentos referentes ao Provider logado, não cancelados e
     * com horário (GMT-3) entre 08:00 e 20:00 do dia especificado em req.query,
     * ordenados por data
     */
    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [Op.between]: [setHours(parsedDate, 8), setHours(parsedDate, 20)],
        },
      },
      order: ['date'],
      attributes: ['id', 'date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    const schedSchema = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
    ];

    const schedule = schedSchema.map(time => {
      const [hour, minute] = time.split(':');
      // Formata searchDate conforme o formato acima HH:MM
      const value = setSeconds(
        setMinutes(setHours(parsedDate, hour), minute),
        0
      );

      return {
        hours: `${time}h`,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        /**
         * Retorna true apenas para os horários (value) depois de agora
         * e estiver ente os appointments buscados acima
         * */
        available:
          isAfter(value, new Date()) &&
          !appointments.find(a => format(a.date, 'HH:mm') === time),

        user: appointments.find(a => format(a.date, 'HH:mm') === time)
          ? appointments.find(a => format(a.date, 'HH:mm') === time).user.name
          : 'Em Aberto',
      };
    });

    return res.json({
      schedule,
    });
  }
}

export default new ScheduleController();
