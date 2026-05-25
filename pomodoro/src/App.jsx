import React, { useState } from 'react';
import { usePomodoro } from './context/PomodoroContext.jsx';
import TimerDisplay from './components/TimerDisplay.jsx';
import Controls from './components/Controls.jsx';
import PhaseTabs from './components/PhaseTabs.jsx';
import CycleTracker from './components/CycleTracker.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import TopBar from './components/TopBar.jsx';

export default function App() {
  const { phaseMeta } = usePomodoro();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className={`h-screen w-screen flex flex-col ${phaseMeta.cssClass} transition-colors duration-700`}>
      <TopBar onOpenSettings={() => setShowSettings(true)} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <PhaseTabs />
        <TimerDisplay />
        <Controls />
        <CycleTracker />
      </main>

      <footer className="text-center text-xs text-white/40 py-3 tracking-wider">
        POMODORO
      </footer>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
