import React from 'react';
import { ConfiguratorProvider } from './context/ConfiguratorContext';
import Scene from './components/3D/Scene';
import Interface from './components/UI/Interface';
import './index.css';

function App() {
  return (
    <ConfiguratorProvider>
      <div className="app-container">
        <Scene />
        <Interface />
      </div>
    </ConfiguratorProvider>
  );
}

export default App;
