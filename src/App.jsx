import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import ColorSuggestionInput from "./component/ColorSuggestionInput";

// --- Constants ---
// const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const API_BASE_URL =  "https://hair-color-analyzer-backend.onrender.com" || "http://127.0.0.1:8000" ;

const MODE_ANALYZE = "analyze";
const MODE_TRAIN = "train";

// --- Main App Component ---
function App() {
  const [mode, setMode] = useState(MODE_ANALYZE);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors">
      <Header currentMode={mode} onModeChange={setMode} />
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {mode === MODE_ANALYZE ? <AnalyzerView /> : <TrainerView />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

// --- Header Component ---
const Header = ({ currentMode, onModeChange }) => (
  <header className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg sticky top-0 z-40 shadow-sm">
    <div className="container mx-auto px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
            <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Hair Colour AI</h1>
      </div>
      <div className="flex items-center p-1 bg-gray-200 dark:bg-gray-800 rounded-full">
        <TabButton
          label="Analyze"
          isActive={currentMode === MODE_ANALYZE}
          onClick={() => onModeChange(MODE_ANALYZE)}
        />
        <TabButton
          label="Train"
          isActive={currentMode === MODE_TRAIN}
          onClick={() => onModeChange(MODE_TRAIN)}
        />
      </div>
    </div>
  </header>
);

const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
      isActive
        ? "text-white"
        : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
    }`}
  >
    {isActive && (
      <motion.div
        layoutId="active-tab"
        className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <span className="relative z-10">{label}</span>
  </button>
);

// --- Analyzer View ---
const AnalyzerView = () => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (selectedFiles) => {
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = [...selectedFiles].slice(0, 3); // Limit to 3 files
      setFiles(newFiles);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviews(newPreviews);
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold">Analyze User Hair Colour</h2>
        <FileUploadZone onFileSelect={handleFileChange} previews={previews} />
        <ActionButton
          onClick={handleAnalyze}
          disabled={files.length === 0 || loading}
          text={loading ? "Analyzing..." : "Analyze Hair Color"}
        />
      </div>
      <div className="mt-0 md:mt-12">
        <AnimatePresence mode="wait">
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {result && <AnalysisResult result={result} />}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Trainer View ---
const TrainerView = () => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [colorName, setColorName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trainedColors, setTrainedColors] = useState([]);

  const fetchTrainedColors = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trained-colors`);
      const data = await response.json();
      if (response.ok) {
        setTrainedColors(data.trained_colors || []);
      }
    } catch (err) {
      console.error("Failed to fetch trained colors:", err);
    }
  }, []);

  useEffect(() => {
    fetchTrainedColors();
  }, [fetchTrainedColors]);

  const handleFileChange = (selectedFiles) => {
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = [...selectedFiles].slice(0, 3); // Limit to 3 files
      setFiles(newFiles);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviews(newPreviews);
      setResult(null);
      setError(null);
    }
  };

  const handleTrain = async () => {
    if (files.length === 0 || !colorName) {
      setError("Please provide a color name and at least one image.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    formData.append("color_name", colorName);

    try {
      const response = await fetch(`${API_BASE_URL}/train`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Training failed");
      setResult(data);
      fetchTrainedColors(); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold">Train New Hair Colour</h2>
        <FileUploadZone onFileSelect={handleFileChange} previews={previews} />
        {/* <input
          type="text"
          value={colorName}
          onChange={(e) => setColorName(e.target.value)}
          placeholder="Enter Color Name (e.g., 'Ash Blonde')"
          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        /> */}
        <div className="p-6">
      <ColorSuggestionInput
        value={colorName}
        onChange={(v) => setColorName(v)}
      />

      <p className="mt-4">Selected Color: {colorName}</p>
    </div>
        <ActionButton
          onClick={handleTrain}
          disabled={files.length === 0 || !colorName || loading}
          text={loading ? "Training..." : "Train New Color"}
        />
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}
            {result && <SuccessMessage message={result.message} />}
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-0 md:mt-12">
        <h3 className="text-2xl font-bold mb-4">Currently Trained Colours</h3>
        <TrainedColorsList colors={trainedColors} />
      </div>
    </div>
  );
};

// --- Shared Components ---

const FileUploadZone = ({ onFileSelect, previews }) => {
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileSelect(e.dataTransfer.files);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div
      className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 border-2 border-dashed 
      border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center 
      text-center p-4 transition-colors hover:border-indigo-500 dark:hover:border-indigo-400 
      bg-white/50 dark:bg-gray-800/50"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => onFileSelect(e.target.files)}
      />

      {previews && previews.length > 0 ? (
        <div className="flex gap-2 h-full overflow-x-auto">
          {previews.map((preview, index) => (
            <img
            key={index}
            src={preview}
            alt={`Preview ${index + 1}`}
            className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-lg object-cover"
          />
          
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400 px-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 sm:w-12 sm:h-12"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          <p className="text-sm sm:text-base md:text-lg text-center">
            Drop up to 3 images here or click to browse
          </p>
        </div>
      )}
    </div>
  );
};

const ActionButton = ({ onClick, disabled, text }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full py-3 px-4 font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-md"
  >
    {text}
  </button>
);

const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex justify-center items-center p-8"
  >
    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
  </motion.div>
);

const ErrorMessage = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="p-4 text-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg"
  >
    <strong>Error:</strong> {message}
  </motion.div>
);

const SuccessMessage = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="p-4 text-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg"
  >
    {message}
  </motion.div>
);

const ColorPalette = ({ colors, title }) => (
  <div>
    <h4 className="font-semibold mb-2">{title}</h4>
    <div className="flex gap-2">
      {colors.map((color, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className="w-12 h-12 rounded-lg shadow-inner"
            style={{ backgroundColor: color.hex }}
            title={`${color.hex} (${color.percentage}%)`}
          />
          <span className="text-xs font-mono text-gray-500">{color.hex}</span>
        </div>
      ))}
    </div>
  </div>
);

const AnalysisResult = ({ result }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    {result.analysis_results &&
      result.analysis_results.map((res, index) => (
        <div
          key={index}
          className="p-6 bg-white dark:bg-gray-800/50 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-bold text-indigo-500">
            Result for image {index + 1}
          </h3>
          {res.error ? (
            <p className="text-red-500">{res.error}</p>
          ) : (
            <>
              <div>
                <p className="text-3xl font-extrabold">
                  {res.closest_match.name}
                </p>
                <p className="text-sm text-gray-500">
                  Similarity: {res.closest_match.similarity}% (Distance:{" "}
                  {res.closest_match.distance})
                </p>
              </div>
              <ColorPalette
                colors={res.user_hair_colors}
                title="Detected Hair Colors"
              />
            </>
          )}
        </div>
      ))}
  </motion.div>
);

const TrainedColorsList = ({ colors }) => (
  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
    {colors.length === 0 ? (
      <p className="text-gray-500">No colors trained yet.</p>
    ) : (
      colors.map((color) => (
        <div
          key={color.id}
          className="p-3 bg-white dark:bg-gray-800/50 rounded-lg flex items-center justify-between"
        >
          <span className="font-semibold">{color.name}</span>
          <div className="flex gap-1">
            {color.lab_colors.map((lab, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-white/20"
                style={{
                  backgroundColor: `lab(${lab[0]}% ${lab[1]} ${lab[2]})`,
                }}
              />
            ))}
          </div>
        </div>
      ))
    )}
  </div>
);

const Footer = () => (
  <footer className="text-center py-6 text-sm text-gray-500">
    <p>Made by musaddik</p>
  </footer>
);

export default App;
4;
