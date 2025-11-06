import React, { useState, useCallback } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";

const PreviewCard = ({ file, preview, result, status, error }) => (
  <div className="bg-white shadow-lg rounded-lg overflow-hidden relative">
    <img src={preview} alt={file.name} className="w-full h-48 object-contain" />

    {status === "loading" && (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )}

    <div className="p-4">
      <p className="text-sm text-gray-800 truncate">{file.name}</p>

      {status === "done" && result && (
        <>
          <div className="flex items-center mt-2">
            <div
              className="w-8 h-8 rounded-full mr-3 border-2 border-gray-200"
              style={{ backgroundColor: result.dominant_color_hex }}
            ></div>
            <div>
              <p className="text-sm text-gray-600">
                Dominant: {result.dominant_color_hex}
              </p>
              <p className="text-sm text-gray-600">
                Closest Match: {result.closest_color} ({result.match_percentage})
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{result.message}</p>

          <div className="mt-3">
            <span
              className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                result.from_cache
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-blue-100 text-blue-700 border border-blue-300"
              }`}
            >
              {result.from_cache ? "From Cache" : "New Analysis"}
            </span>
          </div>
        </>
      )}

      {status === "error" && error && (
        <p className="text-xs text-red-500 mt-2">Error: {error}</p>
      )}
    </div>
  </div>
);

const App = () => {
  const [files, setFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const imageFiles = acceptedFiles.filter((file) =>
      file.type.startsWith("image/")
    );
    const invalidFiles = acceptedFiles.filter(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFiles.length > 0) {
      alert("Only image files are allowed!");
    }

    setFiles(
      imageFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        status: "pending",
        result: null,
        error: null,
      }))
    );
  }, []);

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    const validFiles = files.filter((f) => f.file.type.startsWith("image/"));
    if (validFiles.length === 0) {
      alert("No valid image files to analyze.");
      return;
    }

    setFiles((files) => files.map((f) => ({ ...f, status: "loading" })));

    for (let i = 0; i < validFiles.length; i++) {
      const formData = new FormData();
      formData.append("images", validFiles[i].file);

      try {
        const response = await axios.post(
          "https://hair-color-analyzer-backend.onrender.com/analyze-color",
          formData
        );
        // const response = await axios.post(
        //   "http://localhost:8000/analyze-color",
        //   formData
        // );
        setFiles((files) =>
          files.map((f, index) =>
            index === i
              ? { ...f, status: "done", result: response.data.results[0] }
              : f
          )
        );
      } catch (err) {
        const errorMsg = err.response
          ? err.response.data.detail
          : "An unknown error occurred";
        setFiles((files) =>
          files.map((f, index) =>
            index === i ? { ...f, status: "error", error: errorMsg } : f
          )
        );
      }
    }
  };

  const handleClear = () => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
    setFiles([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <div className="w-full max-w-4xl px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">
            AI Color Analyzer
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Upload an image to detect its dominant color.
          </p>
        </header>

        <div
          {...getRootProps()}
          className={`border-4 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white"
          }`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-blue-600">Drop the files here ...</p>
          ) : (
            <p className="text-gray-500">
              Drag 'n' drop some files here, or click to select files
            </p>
          )}
        </div>

        {files.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Selected Images
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {files.map((file, index) => (
                <PreviewCard key={index} {...file} />
              ))}
            </div>
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={handleAnalyze}
                disabled={files.some((f) => f.status === "loading")}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400"
              >
                {files.some((f) => f.status === "loading")
                  ? "Analyzing..."
                  : "Analyze Images"}
              </button>
              <button
                onClick={handleClear}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
