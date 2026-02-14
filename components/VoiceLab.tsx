
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, Info, Activity } from 'lucide-react';
import { encode, decode, decodeAudioData } from '../services/gemini';

export const VoiceLab: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [status, setStatus] = useState('Idle');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  const toggleConnection = async () => {
    if (isActive) {
      cleanup();
      setIsActive(false);
      setStatus('Disconnected');
      return;
    }

    try {
      setStatus('Connecting...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('Active');
            setIsActive(true);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message) => {
            if (message?.serverContent?.outputTranscription) {
              setTranscription(prev => [...prev, `AI: ${message.serverContent?.outputTranscription?.text}`]);
            } else if (message?.serverContent?.inputTranscription) {
              setTranscription(prev => [...prev, `You: ${message.serverContent?.inputTranscription?.text}`]);
            }

            const audioData = message?.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message?.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live API Error:', e);
            setStatus('Error occurred');
            cleanup();
          },
          onclose: () => {
            setStatus('Closed');
            cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: "You are a friendly tech studio assistant. Help users understand app concepts and visual generation. Keep responses concise for low-latency chat."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('Failed to start');
    }
  };

  const cleanup = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setIsActive(false);
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex-1 grid md:grid-cols-2 gap-8 min-h-0">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
            <div className={`h-full bg-blue-500 transition-all duration-300 ${isActive ? 'w-full' : 'w-0'}`}></div>
          </div>
          
          <div className={`w-48 h-48 rounded-full flex items-center justify-center relative ${isActive ? 'bg-blue-600/20' : 'bg-slate-800'}`}>
            {isActive && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/50 animate-ping opacity-25"></div>
            )}
            <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-inner ${isActive ? 'bg-blue-600' : 'bg-slate-700'}`}>
              <Mic className={`w-12 h-12 text-white transition-transform ${isActive ? 'scale-110' : ''}`} />
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="text-2xl font-bold">{isActive ? 'Listening...' : 'Ready to talk'}</div>
            <div className="text-slate-400 text-sm flex items-center justify-center gap-2">
              <Activity className={`w-4 h-4 ${isActive ? 'text-green-500' : 'text-slate-600'}`} />
              {status}
            </div>
          </div>

          <button
            onClick={toggleConnection}
            className={`px-12 py-4 rounded-2xl font-bold transition-all shadow-xl ${
              isActive 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
            }`}
          >
            {isActive ? 'End Session' : 'Start Conversation'}
          </button>
        </div>

        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col space-y-4 min-h-0">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Volume2 className="text-blue-400" />
              Live Transcription
            </h3>
            <span className="text-xs text-slate-500 font-mono">GEMINI-2.5-FLASH-NATIVE</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {transcription.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm text-center">
                <Info className="mb-2 opacity-50" />
                Text transcription will appear here in real-time.
              </div>
            ) : (
              transcription.map((t, i) => (
                <div key={i} className={`p-3 rounded-xl text-sm ${t.startsWith('You:') ? 'bg-blue-600/10 text-blue-200 ml-4' : 'bg-slate-800 text-slate-200 mr-4'}`}>
                  {t}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500 text-center">
        Powered by Native Multimodal Audio Engine. Supports sub-500ms response times.
      </div>
    </div>
  );
};
