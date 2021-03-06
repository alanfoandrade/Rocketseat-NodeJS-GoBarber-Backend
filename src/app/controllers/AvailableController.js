import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
  toDate,
} from 'date-fns';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';

class AvailableController {
  async index(req, res) {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Data inválida' });
    }

    const searchDate = toDate(Number(date));

    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.params.providerId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
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
        setMinutes(setHours(searchDate, hour), minute),
        0
      );

      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        /**
         * Retorna true apenas para os horários (value) depois de agora
         * e estiver ente os appointments buscados acima
         * */
        available:
          isAfter(value, new Date()) &&
          !appointments.find(a => format(a.date, 'HH:mm') === time),
      };
    });

    return res.json(schedule);
  }
}

export default new AvailableController();
