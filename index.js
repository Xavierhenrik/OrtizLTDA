require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const { isAuthenticated, isAdmin } = require('./middleware/auth');
const User = require('./models/User');
const Project = require('./models/Project');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da sessão
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  }
}));

// Rotas públicas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/projetos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projetos.html'));
});

// Rotas de autenticação
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    req.session.user = {
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin
    };

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Rotas administrativas
app.get('/admin', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// API de Projetos
app.post('/api/projects', isAuthenticated, upload.array('images'), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    const project = new Project({
      title,
      description,
      category,
      imageUrls
    });

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar projeto' });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    // Projetos do banco de dados
    const dbProjects = await Project.find().sort({ createdAt: -1 });

    res.json(dbProjects);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar projetos' });
  }
});

app.put('/api/projects/:id', isAuthenticated, upload.array('images'), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const updateData = { title, description, category };

    if (req.files && req.files.length > 0) {
      updateData.imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar projeto' });
  }
});

app.delete('/api/projects/:id', isAuthenticated, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Projeto deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar projeto' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
}); 