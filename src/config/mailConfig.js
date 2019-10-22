export default {
  host: 'smtp.mailtrap.io',
  port: 2525,
  secure: false,
  auth: {
    user: '4e5343e98d48b2',
    pass: '519a71d86ece43'
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
