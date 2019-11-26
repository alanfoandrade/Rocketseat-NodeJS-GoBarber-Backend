import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';

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
        .min(6),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Erro de validação' });

    // Verifica se email já está cadastrado
    const emailExists = await User.findOne({
      where: { email: req.body.email },
    });

    if (emailExists) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    /* let { avatar_id } = req.body;

    if (avatar_id) {
      const fileExists = await File.findOne({
        where: { id: avatar_id }
      });

      if (!fileExists) {
        return res.status(400).json({ message: 'Arquivo não encontrado' });
      }
    } else avatar_id = null; */

    // Cadastra usuário
    const { id, name, email, provider, avatar_id } = await User.create({
      ...req.body,
      avatar_id: null,
    });

    return res.json({ id, name, email, provider, avatar_id });
  }

  // Editar
  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string()
        .min(6)
        .when('password', (password, field) =>
          password ? field.required() : field
        ),
      /* Caso password tenha sido preenchido,
      tanto oldPassword quanto confirmPassword serão required */
      password: Yup.string().min(6),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Erro de validação' });

    const { email, oldPassword, avatar_id } = req.body;

    // Busca usuário a ser editado pela Id do usuário logado
    const user = await User.findByPk(req.userId);

    if (!user)
      return res
        .status(401)
        .json({ error: 'Erro de autenticação, faça login novamente' });

    // Caso for alterar email, verifica se novo email já está cadastrado
    if (email && email !== user.email) {
      const emailExists = await User.findOne({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }
    }

    if (avatar_id && avatar_id !== user.avatar_id) {
      const fileExists = await File.findOne({
        where: { id: avatar_id },
      });

      if (!fileExists) {
        return res.status(400).json({ message: 'Arquivo não encontrado' });
      }
    }

    // Caso for alterar senha, verifica se a senha antiga está correta
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ message: 'Senha inválida' });
    }

    // Atualiza dados do usuário
    await user.update(req.body);

    const { id, name, avatar } = await User.findByPk(req.userId, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json({ id, name, email, avatar });
  }

  async index(req, res) {
    if (!req.params.userId) {
      const users = await User.findAll({
        // Campos a serem retornados
        attributes: ['id', 'name', 'email', 'provider'],
        // Populate os relacionamento com as seguintes models
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['name', 'path'],
          },
        ],
      });

      // eslint-disable-next-line eqeqeq
      if (users == '')
        return res.status(400).json({ message: 'Nenhum usuário cadastrado' });

      return res.json(users);
    }

    const emailExists = await User.findOne({
      where: { id: req.params.userId },
    });

    if (!emailExists)
      return res.status(400).json({ message: 'Usuário não encontrado' });

    const user = await User.findOne({
      where: { id: req.params.userId },
      // Campos a serem retornados
      attributes: ['id', 'name', 'email', 'provider'],
      // Populate os relacionamento com as seguintes models
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['name', 'path'],
        },
      ],
    });

    return res.json(user);
  }
}

export default new UserController();
