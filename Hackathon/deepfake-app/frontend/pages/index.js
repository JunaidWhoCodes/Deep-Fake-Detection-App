import { useState } from 'react'
import UploadForm from '../components/UploadForm'

export default function Home() {
  const [showDetector, setShowDetector] = useState(false)
  const [result, setResult] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out z-50 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-8">Menu</h2>
          <nav className="space-y-4">
            <button
              onClick={() => { setShowDetector(false); setMenuOpen(false); }}
              className="block w-full text-left py-2 px-4 rounded hover:bg-gray-800 transition"
            >
              🏠 Home
            </button>
            <button
              onClick={() => { setShowDetector(true); setMenuOpen(false); }}
              className="block w-full text-left py-2 px-4 rounded hover:bg-gray-800 transition"
            >
              🔍 Image Detection
            </button>
            <button className="block w-full text-left py-2 px-4 rounded hover:bg-gray-800 transition">
              ℹ️ About
            </button>
          </nav>
        </div>
      </div>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-black bg-opacity-30 backdrop-blur-md z-30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white hover:text-gray-300 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-bold">DeepFake Detector</h1>
          <div className="w-6"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {!showDetector ? (
          // Landing Page with Animation
          <div className="container mx-auto px-6 py-20">
            <div className="text-center animate-fade-in">
              <h1 className="text-6xl font-bold text-white mb-6 animate-slide-down">
                Welcome to DeepFake Detector
              </h1>
              <p className="text-2xl text-gray-200 mb-12 animate-slide-up">
                AI-Powered Image Authentication
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 transform hover:scale-105 transition duration-300 animate-fade-in-delay-1">
                  <div className="text-5xl mb-4">🔒</div>
                  <h3 className="text-xl font-bold text-white mb-2">Secure</h3>
                  <p className="text-gray-300">Your images are processed securely and never stored</p>
                </div>
                
                <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 transform hover:scale-105 transition duration-300 animate-fade-in-delay-2">
                  <div className="text-5xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-white mb-2">Fast</h3>
                  <p className="text-gray-300">Get instant results with our advanced AI model</p>
                </div>
                
                <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 transform hover:scale-105 transition duration-300 animate-fade-in-delay-3">
                  <div className="text-5xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold text-white mb-2">Accurate</h3>
                  <p className="text-gray-300">State-of-the-art detection accuracy</p>
                </div>
              </div>

              <button
                onClick={() => setShowDetector(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-12 py-4 rounded-full text-xl font-semibold hover:from-pink-600 hover:to-purple-700 transform hover:scale-110 transition duration-300 shadow-2xl animate-pulse-slow"
              >
                Start Detection
              </button>
            </div>
          </div>
        ) : (
          // Detection Interface
          <div className="container mx-auto px-6 py-12 animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-6">Image Detection</h2>
                <p className="text-gray-200 mb-4">Upload an image to check if it's real or fake</p>
                <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-3 mb-6">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ <strong>Demo Tool:</strong> This uses computer vision heuristics. Production systems require trained deep learning models for accurate detection.
                  </p>
                </div>
                
                <UploadForm onResult={setResult} />

                {result && (
                  <div className="mt-8 bg-white bg-opacity-20 backdrop-blur-md rounded-xl p-6 animate-slide-up">
                    <h3 className="text-xl font-bold text-white mb-4">Results:</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200">Prediction:</span>
                        <span className={`text-2xl font-bold ${result.prediction === 'Real' ? 'text-green-400' : 'text-red-400'}`}>
                          {result.prediction}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200">Confidence:</span>
                        <span className="text-2xl font-bold text-blue-400">
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3 mt-4">
                        <div
                          className={`h-3 rounded-full ${result.prediction === 'Real' ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${result.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
