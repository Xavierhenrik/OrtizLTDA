const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/admin/login');
};

const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Acesso negado' });
};

module.exports = {
  isAuthenticated,
  isAdmin
}; 