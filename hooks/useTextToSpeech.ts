import { useState, useEffect, useCallback } from 'react';

const useTextToSpeech = () => {
  const [frenchVoices, setFrenchVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        const frVoices = allVoices.filter(voice => voice.lang.startsWith('fr'));
        setFrenchVoices(frVoices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const synthesize = useCallback((text: string, voiceURI: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      if (!window.speechSynthesis || !navigator.mediaDevices || !window.MediaRecorder) {
        return reject(new Error("Your browser does not support the required Speech and Media Recording APIs."));
      }
      
      const allVoices = window.speechSynthesis.getVoices();
      const selectedVoice = allVoices.find(v => v.voiceURI === voiceURI);

      if (!selectedVoice) {
        return reject(new Error("The selected voice was not found. It might no longer be available in your browser."));
      }
      
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        return reject(new Error("Microphone access was denied. It's required to record the synthesized audio for download. Please grant permission and try again."));
      }

      setIsSynthesizing(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.lang = utterance.voice.lang;
      utterance.pitch = 1;
      utterance.rate = 1;

      // Use 'audio/webm' for wide compatibility.
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      const stopRecording = () => {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        stream.getTracks().forEach(track => track.stop());
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        if (audioBlob.size === 0) {
            setIsSynthesizing(false);
            return reject(new Error("Recording failed, the resulting audio file is empty. This can happen if the microphone is muted."));
        }
        const audioUrl = URL.createObjectURL(audioBlob);
        setIsSynthesizing(false);
        resolve(audioUrl);
      };
      
      mediaRecorder.onerror = (event) => {
        stopRecording();
        setIsSynthesizing(false);
        reject(new Error(`An error occurred with the MediaRecorder: ${event}`));
      }

      utterance.onend = stopRecording;
      utterance.onerror = (event) => {
        stopRecording();
        setIsSynthesizing(false);
        reject(new Error(`An error occurred during speech synthesis: ${event.error}`));
      };
      
      mediaRecorder.start();
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  return { frenchVoices, isSynthesizing, synthesize };
};

export default useTextToSpeech;