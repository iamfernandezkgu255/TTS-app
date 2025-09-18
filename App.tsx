import React, { useState, useCallback, useEffect } from 'react';
import { ConversionStatus } from './types';
import FileUpload from './components/FileUpload';
import Player from './components/Player';
import Spinner from './components/Spinner';
import StatusDisplay from './components/StatusDisplay';
import { transcribeAudio, translateText } from './services/geminiService';
import useTextToSpeech from './hooks/useTextToSpeech';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the `data:...;base64,` part
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

const App: React.FC = () => {
  const [status, setStatus] = useState<ConversionStatus>(ConversionStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  const [englishFile, setEnglishFile] = useState<File | null>(null);
  const [englishAudioUrl, setEnglishAudioUrl] = useState<string | null>(null);
  const [englishText, setEnglishText] = useState<string>('');

  const [frenchText, setFrenchText] = useState<string>('');
  const [frenchAudioUrl, setFrenchAudioUrl] = useState<string | null>(null);
  
  const { frenchVoices, isSynthesizing, synthesize } = useTextToSpeech();
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');

  useEffect(() => {
    if (frenchVoices.length > 0 && !selectedVoiceURI) {
      setSelectedVoiceURI(frenchVoices[0].voiceURI);
    }
  }, [frenchVoices, selectedVoiceURI]);

  const isProcessing = (status !== ConversionStatus.IDLE && status !== ConversionStatus.DONE && status !== ConversionStatus.ERROR) || isSynthesizing;

  const handleFileSelect = (file: File) => {
    if (isProcessing) return;
    resetState();
    setEnglishFile(file);
    setEnglishAudioUrl(URL.createObjectURL(file));
  };
  
  const resetState = () => {
    setStatus(ConversionStatus.IDLE);
    setError(null);
    setEnglishFile(null);
    if(englishAudioUrl) URL.revokeObjectURL(englishAudioUrl);
    setEnglishAudioUrl(null);
    setEnglishText('');
    setFrenchText('');
    if(frenchAudioUrl) URL.revokeObjectURL(frenchAudioUrl);
    setFrenchAudioUrl(null);
  };

  const handleConvert = useCallback(async () => {
    if (!englishFile) {
      setError("Please select an audio file first.");
      return;
    }
    if (!selectedVoiceURI) {
        setError("Please select a voice. If none are available, your browser may not support French speech synthesis.");
        return;
    }

    setError(null);
    setFrenchText('');
    if(frenchAudioUrl) URL.revokeObjectURL(frenchAudioUrl);
    setFrenchAudioUrl(null);

    try {
      // 1. Transcribe
      setStatus(ConversionStatus.TRANSCRIBING);
      const base64Audio = await fileToBase64(englishFile);
      const transcribedText = await transcribeAudio(base64Audio, englishFile.type);
      setEnglishText(transcribedText);

      // 2. Translate
      setStatus(ConversionStatus.TRANSLATING);
      const translatedText = await translateText(transcribedText);
      setFrenchText(translatedText);
      
      // 3. Synthesize
      setStatus(ConversionStatus.SYNTHESIZING);
      const synthesizedAudioUrl = await synthesize(translatedText, selectedVoiceURI);
      setFrenchAudioUrl(synthesizedAudioUrl);

      setStatus(ConversionStatus.DONE);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setStatus(ConversionStatus.ERROR);
    }
  }, [englishFile, selectedVoiceURI, synthesize]);

  const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <main className="w-full max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            English MP3 to French Audio
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Convert English speech to French speech using AI.
          </p>
        </header>

        <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl shadow-indigo-900/20 space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Input */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-indigo-400">1. Upload Audio</h2>
              <FileUpload onFileSelect={handleFileSelect} disabled={isProcessing} />
              {englishAudioUrl && <Player src={englishAudioUrl} title="Original English Audio" />}
            </div>

            {/* Right Column: Convert */}
            <div className="space-y-4">
               <h2 className="text-2xl font-semibold text-indigo-400">2. Convert</h2>
               <div className="space-y-2">
                    <label htmlFor="voice-select" className="block text-sm font-medium text-slate-300">
                        Select a French Voice
                    </label>
                    <select
                        id="voice-select"
                        value={selectedVoiceURI}
                        onChange={(e) => setSelectedVoiceURI(e.target.value)}
                        disabled={isProcessing || frenchVoices.length === 0}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-slate-800 disabled:cursor-not-allowed"
                        aria-label="Select French voice"
                    >
                        {frenchVoices.length === 0 && status === ConversionStatus.IDLE ? (
                            <option>Loading voices...</option>
                        ) : (
                            frenchVoices.map((voice) => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                    {voice.name} ({voice.lang})
                                </option>
                            ))
                        )}
                         {frenchVoices.length === 0 && status !== ConversionStatus.IDLE && (
                             <option>No French voices found</option>
                         )}
                    </select>
                </div>

               <button
                  onClick={handleConvert}
                  disabled={!englishFile || isProcessing || !selectedVoiceURI}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? <><Spinner /> Converting...</> : 'Start Conversion'}
                </button>
            </div>
          </div>
          
          {(isProcessing || status === ConversionStatus.DONE || status === ConversionStatus.ERROR && englishText) && (
             <div className="space-y-6 pt-6 border-t border-slate-700">
                <h2 className="text-2xl font-semibold text-indigo-400">3. Results</h2>
                <StatusDisplay status={status} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* English Text */}
                    <div className="bg-slate-900/70 p-4 rounded-lg">
                        <h3 className="font-semibold text-slate-300 mb-2">Transcribed English Text</h3>
                        <p className="text-slate-400 h-32 overflow-y-auto font-mono text-sm">{englishText || '...'}</p>
                    </div>

                    {/* French Text */}
                    <div className="bg-slate-900/70 p-4 rounded-lg">
                        <h3 className="font-semibold text-slate-300 mb-2">Translated French Text</h3>
                        <p className="text-slate-400 h-32 overflow-y-auto font-mono text-sm">{frenchText || '...'}</p>
                    </div>
                </div>
                
                 {status === ConversionStatus.DONE && frenchAudioUrl && (
                    <div className="space-y-4 pt-4">
                        <Player src={frenchAudioUrl} title="Synthesized French Audio" />
                        <a
                            href={frenchAudioUrl}
                            download={`french_translation_${new Date().toISOString().slice(0,10)}.webm`}
                            className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-100 bg-indigo-600 hover:bg-indigo-700 transition-colors"
                            aria-label="Download synthesized French audio"
                        >
                           <DownloadIcon />
                            Download Audio
                        </a>
                    </div>
                 )}
            </div>
          )}
        </div>
        <footer className="text-center text-slate-500 text-sm">
          <p>Powered by Gemini API and Browser Speech Synthesis.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;