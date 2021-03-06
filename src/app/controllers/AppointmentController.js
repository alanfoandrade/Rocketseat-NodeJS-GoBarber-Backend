import * as Yup from 'yup';
import { format, startOfHour, parseISO, isBefore, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    /**
     * Lista todos agendamentos do usuario, não cancelados, ordenados por data,
     * populando o relacionamento com provider e o campo avatar do provider,
     * paginado com 20 registros por pagina
     */
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Erro de validacao' });

    const { provider_id, date } = req.body;

    // Verifica se provider_id eh um provider
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider)
      return res.status(401).json({
        error: 'Você só pode fazer um agendamento com um prestador de serviços',
      });

    if (provider_id === req.userId)
      return res.status(401).json({
        error: 'Não é possível agendar um horário com você mesmo',
      });
    // Verifica se o horario de agendamento ja passou
    // startOfHour retorna apenas a hora passada, descartando minutos e segundos
    // parseISO transforma o objeto JSON em formado Date do JS
    const hourStart = startOfHour(parseISO(date));
    if (isBefore(hourStart, new Date()))
      return res.status(400).json({ error: 'Horário já passou' });

    // Verifica disponibilidade do horario de agendamento com o prestador de servicos especificado
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability)
      return res.status(400).json({ error: 'Horário não disponível' });

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    /**
     * Notificar reserva ao prestador de servico
     */

    const user = await User.findByPk(req.userId);
    // Formatacao da data
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (appointment.canceled_at)
      return res.status(400).json({
        error: 'Agendamento já foi cancelado',
      });

    if (appointment.user_id !== req.userId)
      return res.status(401).json({
        error: 'Não tem permissão para cancelar esse agendamento',
      });

    const dateWithMargin = subHours(appointment.date, 2);

    if (isBefore(dateWithMargin, new Date()))
      return res.status(401).json({
        error: 'Agendamentos só podem ser cancelados 2 horas antes',
      });

    appointment.canceled_at = new Date();

    const {
      date,
      createdAt,
      canceled_at,
      name = appointment.provider.name,
      email = appointment.provider.email,
    } = await appointment.save();

    await Queue.add(CancellationMail.key, {
      appointment,
    });

    return res.json({
      date,
      createdAt,
      canceled_at,
      name,
      email,
    });
  }
}

export default new AppointmentController();
