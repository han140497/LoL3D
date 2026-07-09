import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import { BRAND } from './lib/constants.js';

// Placeholder pages — each gets built out as its own step.
function Placeholder({ title }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      <p className="mt-3 text-slate-400">{BRAND.tagline}</p>
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Placeholder title={`Welcome to ${BRAND.fullName}`} />} />
        <Route path="/catalog/:category?" element={<Placeholder title="Catalog" />} />
        <Route path="/product/:slug" element={<Placeholder title="Product" />} />
        <Route path="/quote" element={<Placeholder title="Get a Quote" />} />
      </Routes>
    </div>
  );
}
