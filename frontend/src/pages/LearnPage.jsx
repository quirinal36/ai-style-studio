import { useState } from 'react';
import VGG19Diagram from '../components/learn/VGG19Diagram';
import FeatureMapViewer from '../components/learn/FeatureMapViewer';
import GramMatrixView from '../components/learn/GramMatrixView';
import LossChart from '../components/learn/LossChart';

const TABS = [
  { key: 'vgg19', label: 'VGG19 구조' },
  { key: 'features', label: '특징 맵' },
  { key: 'gram', label: 'Gram Matrix' },
  { key: 'loss', label: 'Loss 그래프' },
];

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState('vgg19');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">학습 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">
          Neural Style Transfer의 원리를 시각적으로 탐구합니다
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'vgg19' && <VGG19Diagram />}
      {activeTab === 'features' && <FeatureMapViewer />}
      {activeTab === 'gram' && <GramMatrixView />}
      {activeTab === 'loss' && <LossChart />}
    </div>
  );
}
