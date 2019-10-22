export default {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  default: {
    from: 'Equipe GoBarber <noreply@gobarber.com>'
  }
};

/**
 * serviços de e-mail recomendados
 * Amazon SES
 * Mailgun,
 * Sparkpost,
 * Mandril (Apenas emails Mailchimp)
 * Mailtrap (Ambiente de desenvolvimento)
 */
