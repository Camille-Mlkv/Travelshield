import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import WalletsPage from './pages/WalletsPage.jsx';
import PoliciesPage from './pages/PoliciesPage';
import ModuleDetailsPage from './pages/ModuleDetailsPage.jsx';
import BuyPolicyPage from './pages/BuyPolicyPage';
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/wallets" element={<WalletsPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/module/:id" element={<ModuleDetailsPage />} />
          <Route path="/buy/:moduleId" element={<BuyPolicyPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;