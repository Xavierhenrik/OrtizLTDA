import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './routes/Home';
import { Projects } from './routes/Projects';
import { Budget } from './routes/Budget';
import { Login } from './routes/Login';
import { AdminDashboard } from './routes/AdminDashboard';
import { Building } from 'lucide-react';
import { useStore } from './store/useStore';

function App() {
  const { isAuthenticated, user } = useStore();

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="bg-white shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-orange-500" />
                <span className="text-xl font-bold">Ortiz LTDA</span>
              </Link>
              
              <div className="flex space-x-6">
                <Link to="/" className="text-gray-700 hover:text-orange-500">Home</Link>
                <Link to="/projects" className="text-gray-700 hover:text-orange-500">Projetos</Link>
                <Link to="/budget" className="text-gray-700 hover:text-orange-500">Orçamento</Link>
                {isAuthenticated && user?.isAdmin ? (
                  <Link to="/admin" className="text-gray-700 hover:text-orange-500">Admin</Link>
                ) : (
                  <Link to="/login" className="text-gray-700 hover:text-orange-500">Login</Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-auto">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Ortiz LTDA</h3>
                <p className="text-gray-400">
                  Construindo sonhos e transformando vidas desde 2000.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Contato</h3>
                <p className="text-gray-400">
                  Email: contato@ortiz.com<br />
                  Telefone: (11) 1234-5678
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                <p className="text-gray-400">
                  Av. Paulista, 1000<br />
                  São Paulo - SP
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App