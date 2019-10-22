import Notification from '../schemas/Notification';
import User from '../models/User';

class NotificationController {
  async index(req, res) {
    // Verifica se o usuario logado é Prestador de serviço
    const isProvider = await User.findOne({
      where: { id: req.userId, provider: true }
    });

    if (!isProvider)
      return res.status(401).json({
        error: 'Apenas prestadores de serviço podem acessar as notificações'
      });

    const notifications = await Notification.find({
      user: req.userId,
      read: false
    })
      .sort({ createdAt: 'desc' })
      .limit(20);

    return res.json(notifications);
  }

  async update(req, res) {
    // Verifica se o usuario logado é Prestador de serviço
    const isProvider = await User.findOne({
      where: { id: req.userId, provider: true }
    });

    if (!isProvider)
      return res.status(401).json({
        error: 'Apenas prestadores de serviço podem ler as notificações'
      });

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    return res.json(notification);
  }
}

export default new NotificationController();
