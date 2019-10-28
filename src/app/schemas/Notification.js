import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    // Conteudo da notificacao
    content: {
      type: String,
      required: true,
    },
    // Id do usuario que vai receber a notificacao
    user: {
      type: Number,
      required: true,
    },
    // Lida
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', NotificationSchema);
