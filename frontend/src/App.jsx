import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import StyleTransferPage from './pages/StyleTransferPage';
import FastStylePage from './pages/FastStylePage';
import WebcamPage from './pages/WebcamPage';
import LearnPage from './pages/LearnPage';
import GalleryPage from './pages/GalleryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/style-transfer" replace />} />
          <Route path="/style-transfer" element={<StyleTransferPage />} />
          <Route path="/fast-style" element={<FastStylePage />} />
          <Route path="/webcam" element={<WebcamPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
