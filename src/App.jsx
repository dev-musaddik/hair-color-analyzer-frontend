import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

import Header from "./components/Header";
import Analysis from "./components/Analysis";
import ColorManager from "./components/ColorManager";
import ColorDetail from "./components/ColorDetail";
import TrainingWizard from "./components/TrainingWizard";
import CacheManager from "./components/CacheManager";

function App() {
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [view, setView] = useState('analyzer'); // 'analyzer' or 'manager'
  const [selectedColor, setSelectedColor] = useState(null);
  const [showTrainingWizard, setShowTrainingWizard] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // When training is complete, hide wizard and refresh the manager view
  const handleTrainingComplete = () => {
    setShowTrainingWizard(false);
    // Force a re-render of the ColorManager component to fetch new data
    setView(''); 
    setTimeout(() => setView('manager'), 0);
  };

  const renderView = () => {
    if (view === 'manager') {
      if (selectedColor) {
        return <ColorDetail color={selectedColor} onBack={() => setSelectedColor(null)} setLoading={setLoading} />;
      }
      return <ColorManager setSelectedColor={setSelectedColor} setShowTrainingWizard={setShowTrainingWizard} />;
    }
    // Default to analyzer view
    return (
      <div className="w-full space-y-8">
        <Analysis setLoading={setLoading} loading={loading} />
        <CacheManager />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors duration-500 flex flex-col items-center relative overflow-x-hidden selection:bg-indigo-500/30">
      {/* Ambient Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden max-w-full">
        <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] rounded-full bg-purple-400/20 dark:bg-purple-900/20 blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-soft-light animate-blob" />
        <div className="absolute top-[10%] right-[-20%] w-[400px] h-[400px] rounded-full bg-blue-400/20 dark:bg-indigo-900/20 blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-soft-light animate-blob animation-delay-2000" />
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm"
          >
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-4 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                  animate={{ y: [-10, 0, -10] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2, ease: "easeInOut" }}
                />
              ))}
            </div>
            <p className="mt-8 font-medium text-indigo-900 dark:text-indigo-200 tracking-wider uppercase text-sm">
              Processing...
            </p>
          </motion.div>
        )}
        {showTrainingWizard && (
          <TrainingWizard 
            onComplete={handleTrainingComplete}
            onCancel={() => setShowTrainingWizard(false)}
            setLoading={setLoading}
          />
        )}
      </AnimatePresence>

      {/* Main Content Container */}
      <div className="w-full max-w-6xl px-6 py-12 z-10 flex flex-col items-center">
        <Header 
          view={view}
          setView={setView}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
        
        <AnimatePresence mode="wait">
          <motion.main 
            key={view + (selectedColor?.id || '')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {renderView()}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
