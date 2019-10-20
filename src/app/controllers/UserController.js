import * as Yup from 'yup';
import User from '../models/user';

class UserController {
  // Cadastrar
  async store(req, res) {
    // Validações
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6)
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Erro de validação' });

    // Verifica se email já está cadastrado
    const emailExists = await User.findOne({
      where: { email: req.body.email }
    });

    if (emailExists) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Cadastra usuário
    const { id, name, email, provider } = await User.create(req.body);

    return res.json({ id, name, email, provider });
  }

  // Editar
  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      )
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Erro de validação' });

    const { email, oldPassword } = req.body;

    // Busca usuário a ser editado pela Id do usuário logado
    const user = await User.findByPk(req.userId);

    // Caso for alterar email, verifica se novo email já está cadastrado
    if (email !== user.email) {
      const emailExists = await User.findOne({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }
    }

    if (req.body.password && !oldPassword)
      return res.status(400).json({ error: 'Erro de validação' });
    // Caso for alterar senha, verifica se a senha antiga está correta
    if (!(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ message: 'Senha inválida' });
    }

    // Atualiza dados do usuário
    const { id, name, provider } = await user.update(req.body);

    return res.json({ id, name, email, provider });
  }

  async list(req, res) {
    if (!req.params.userId) {
      const users = await User.findAll();

      // eslint-disable-next-line eqeqeq
      if (users == '')
        return res.status(400).json({ message: 'Nenhum usuário cadastrado' });

      return res.json(users);
    }

    const emailExists = await User.findOne({
      where: { id: req.params.userId }
    });

    if (!emailExists)
      return res.status(400).json({ message: 'Usuário não encontrado' });

    const { id, name, email, provider } = await User.findOne({
      where: { id: req.params.userId }
    });

    return res.json({ id, name, email, provider });
  }
}

export default new UserController();
