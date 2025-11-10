import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const resultsRef = useRef(null);
  useEffect(() => {
    if (analysisResults.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [analysisResults]);

  // const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
  const API_BASE = import.meta.env.VITE_API_BASE || "https://hair-color-analyzer-backend.onrender.com";

  useEffect(() => {
    console.log("Dark Mode Status:", darkMode); // Debug log
    if (darkMode) {
      document.documentElement.classList.add("dark");
      console.log("Dark class added to <html>");
    } else {
      document.documentElement.classList.remove("dark");
      console.log("Dark class removed from <html>");
    }

    return () => imagePreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [darkMode, imagePreviews]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const processFiles = (files) => {
    if (files.length > 3) {
      setError("Maximum 3 images allowed.");
      return;
    }
    setSelectedFiles(files);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previewUrls);
    setError(null);
    setAnalysisResults([]);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    processFiles(files);
  };

  // --- Drag & Drop Handlers ---
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (files.length === 0) {
      setError("Please drop valid image files.");
      return;
    }
    processFiles(files);
  }, []);

  const handleAnalyzeClick = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select one or more files first.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResults([]);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      // Artificial delay to show off the nice loader if response is too fast (optional, remove in prod)
      // await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await fetch(`${API_BASE}/analyze-hair-color`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Analysis failed.");
      }

      const data = await response.json();
      setAnalysisResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCacheClick = async () => {
    if (!window.confirm("Are you sure you want to clear the server cache?"))
      return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/clear-cache`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to clear cache.");
      clearSelection();
      alert("Cache cleared successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setImagePreviews([]);
    setAnalysisResults([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors duration-500 flex flex-col items-center relative overflow-x-hidden selection:bg-indigo-500/30">
      {/* Ambient Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden max-w-full">
        <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] rounded-full bg-purple-400/20 dark:bg-purple-900/20 blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-soft-light animate-blob" />
        <div className="absolute top-[10%] right-[-20%] w-[400px] h-[400px] rounded-full bg-blue-400/20 dark:bg-indigo-900/20 blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-soft-light animate-blob animation-delay-2000" />
      </div>

      {/* Professional Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 dark:bg-black/60"
          >
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-4 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                  animate={{ y: [-10, 0, -10], opacity: [1, 0.5, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 font-medium text-indigo-900 dark:text-indigo-200 tracking-wider uppercase text-sm"
            >
              Analyzing Pigments...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Container */}
      <div className="w-full max-w-6xl px-6 py-12 z-10 flex flex-col items-center">
        {/* Header */}
        <header className="w-full flex justify-between items-start mb-16">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-purple-400 pb-2">
              Gl Hair AI Agent
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg font-medium">
              Professional Pigment & Style Analysis
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95"
          >
            {darkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
        </header>

        {/* Upload Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative group flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2.5rem] transition-all duration-300 ease-out
                    ${
                      isDragging
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-[1.02]"
                        : "border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 hover:border-gray-400 dark:hover:border-gray-600"
                    } backdrop-blur-md`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />

            <div
              className={`p-5 mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-transform duration-300 ${
                isDragging ? "scale-110" : "group-hover:scale-110"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">
              {isDragging ? "Drop images here" : "Drag & drop your images"}
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
              or click to browse (Max 3)
            </p>

            {/* Previews floating in drop zone if selected */}
            <AnimatePresence>
              {imagePreviews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex gap-3 mt-6 p-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 z-30" // z-30 to be above file input if needed, but actually we want input above.
                >
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="relative">
                      <img
                        src={preview}
                        alt={`preview-${i}`}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                      />
                      {i === 0 && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
                          1
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Bar */}
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full md:w-auto px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl text-center flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 w-full md:w-auto justify-center">
              <button
                onClick={clearSelection}
                disabled={loading || selectedFiles.length === 0}
                className="px-6 py-3 rounded-xl font-semibold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                onClick={handleAnalyzeClick}
                disabled={loading || selectedFiles.length === 0}
                className="relative overflow-hidden px-8 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Start Analysis"}
              </button>
            </div>
          </div>

          <button
            onClick={handleClearCacheClick}
            className="mx-auto mt-6 block text-xs font-medium text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            Clear Server Cache
          </button>
        </motion.div>

        {/* Results Grid */}
        {analysisResults.length > 0 && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="w-full mt-24 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {analysisResults.map((result, index) => (
              <ResultCard
                key={result.filename + index}
                result={result}
                preview={imagePreviews[index]}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// --- Enhanced Result Card ---
const ResultCard = ({ result, preview, index }) => {
  const ACCURACY_OFFSET = 17; // Maintained user's offset logic

  if (result.error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="p-6 bg-red-50/50 dark:bg-red-900/10 backdrop-blur-sm rounded-3xl border border-red-200 dark:border-red-900/50 flex flex-col gap-4"
      >
        <div className="flex gap-4 items-center opacity-50">
          <img
            src={preview}
            alt="error-thumb"
            className="w-16 h-16 rounded-2xl object-cover grayscale"
          />
          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
            {result.filename}
          </h4>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 border border-red-100 dark:border-red-900/30 rounded-2xl">
          <p className="text-sm font-medium text-red-600 dark:text-red-400 text-center">
            {result.error}
          </p>
        </div>
      </motion.div>
    );
  }

  const { best_match, all_set_matches, dominant_hair_colors } = result;
  const matchPercentage = best_match
    ? Math.max(
        0,
        parseFloat(best_match.similarity_percentage) - ACCURACY_OFFSET
      )
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
      className="group relative bg-white dark:bg-[#111] rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-100 dark:border-gray-800 overflow-hidden"
    >
      {/* Cached Badge */}
      {result.cached && (
        <div className="absolute top-4 right-4 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-md">
          Cached
        </div>
      )}

      {/* Header with Thumbnail */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative">
          <img
            src={preview}
            alt={result.filename}
            className="w-20 h-20 rounded-2xl object-cover shadow-sm border-2 border-white dark:border-gray-700"
          />
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] pointer-events-none"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className="font-bold text-lg text-gray-900 dark:text-white truncate"
            title={result.filename}
          >
            {result.filename}
          </h4>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
            Analysis Complete
          </p>
        </div>
      </div>

      {/* Main Result Block */}
      {best_match ? (
        <div className="mb-8 p-5 bg-indigo-50/80 dark:bg-indigo-950/30 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 relative overflow-hidden">
          {/* Decorative background swirl */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-2xl pointer-events-none"></div>

          <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1">
            Top Match
          </p>
          <h5 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2">
            {best_match.set_name}
          </h5>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2.5 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${matchPercentage}%` }}
                transition={{
                  duration: 1,
                  delay: 0.5 + index * 0.2,
                  ease: "easeOut",
                }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
            </div>
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 min-w-[3.5rem] text-right">
              {Math.round(matchPercentage)}%
            </span>
          </div>

          {/* Metadata Chips */}
          <div className="flex flex-wrap gap-2">
            <Chip
              label={best_match.style}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
                  <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
                </svg>
              }
            />
            <Chip
              label={best_match.tone}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="13.5" cy="6.5" r="2.5" />
                  <circle cx="17.5" cy="10.5" r="2.5" />
                  <circle cx="8.5" cy="7.5" r="2.5" />
                  <circle cx="6.5" cy="12.5" r="2.5" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
              }
            />
            <Chip label={`Lvl ${best_match.level}`} />
          </div>
        </div>
      ) : (
        <div className="mb-8 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-3xl text-center text-gray-500">
          No close match found.
        </div>
      )}

      {/* Color Palette Section */}
      <div className="mb-6">
        <h6 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Pigment Breakdown
        </h6>
        <div className="space-y-3">
          {dominant_hair_colors.slice(0, 4).map((color, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                style={{ backgroundColor: color.hex }}
                title={color.hex}
              />
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-mono text-gray-500 dark:text-gray-400 opacity-75">
                    {color.hex}
                  </span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {Math.round(color.percentage)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${color.percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color.hex }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternatives (Collapsible-ish look) */}
      {all_set_matches && all_set_matches.length > 1 && (
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-400 mb-3">
            Similar Styles
          </p>
          <ul className="space-y-2">
            {all_set_matches.slice(1, 4).map((set) => (
              <li
                key={set.set_id}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-600 dark:text-gray-300 truncate pr-4">
                  {set.set_name}
                </span>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                  {Math.max(
                    0,
                    Math.round(
                      parseFloat(set.similarity_percentage) - ACCURACY_OFFSET
                    )
                  )}
                  %
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

// --- Refined Chip Component ---
const Chip = ({ label, icon }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm">
    {icon && <span className="opacity-70">{icon}</span>}
    {label}
  </span>
);

export default App;
