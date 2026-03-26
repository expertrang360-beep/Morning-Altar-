import { useEffect, useRef } from 'react';

export type MusicStyle = 'emotional' | 'motivational' | 'inspirational' | 'nature';

export function useAmbientAudio(style: MusicStyle, isMuted: boolean, isPlaying: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const activeOscillators = useRef<OscillatorNode[]>([]);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const styleRef = useRef<MusicStyle>(style);
  const nextNoteTimeRef = useRef<number>(0);
  const effectInputRef = useRef<GainNode | null>(null);

  useEffect(() => {
    styleRef.current = style;
    
    // Handle switching to/from nature
    if (ctxRef.current && masterGainRef.current) {
      if (style === 'nature' && !noiseNodeRef.current) {
         startNature(ctxRef.current, masterGainRef.current);
      } else if (style !== 'nature' && noiseNodeRef.current) {
         noiseNodeRef.current.stop();
         noiseNodeRef.current.disconnect();
         noiseNodeRef.current = null;
      }
    }
  }, [style]);

  const startNature = (ctx: AudioContext, destination: AudioNode) => {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 800;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    noise.connect(filter);
    filter.connect(destination);
    noise.start();
    noiseNodeRef.current = noise;
  };

  useEffect(() => {
    if (!isPlaying) {
      if (ctxRef.current && ctxRef.current.state === 'running') {
        ctxRef.current.suspend();
      }
      return;
    }

    if (!ctxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      ctxRef.current = new AudioContextClass();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.connect(ctxRef.current.destination);
      masterGainRef.current.gain.value = isMuted ? 0 : 0.15;

      // Create Reverb
      const convolver = ctxRef.current.createConvolver();
      const reverbLength = ctxRef.current.sampleRate * 4;
      const impulse = ctxRef.current.createBuffer(2, reverbLength, ctxRef.current.sampleRate);
      for (let i = 0; i < 2; i++) {
        const channel = impulse.getChannelData(i);
        for (let j = 0; j < reverbLength; j++) {
          channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / reverbLength, 3);
        }
      }
      convolver.buffer = impulse;
      convolver.connect(masterGainRef.current);

      // Create Delay
      const delay = ctxRef.current.createDelay();
      delay.delayTime.value = 0.75;
      const feedback = ctxRef.current.createGain();
      feedback.gain.value = 0.2;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(convolver);

      effectInputRef.current = ctxRef.current.createGain();
      effectInputRef.current.connect(convolver);
      effectInputRef.current.connect(delay);
      effectInputRef.current.connect(masterGainRef.current);

      nextNoteTimeRef.current = ctxRef.current.currentTime + 0.1;

      if (styleRef.current === 'nature') {
        startNature(ctxRef.current, masterGainRef.current);
      }

      const playNote = (freq: number, duration: number, type: OscillatorType = 'sine') => {
        if (!ctxRef.current || !effectInputRef.current) return;
        const osc = ctxRef.current.createOscillator();
        const gain = ctxRef.current.createGain();
        
        osc.type = type;
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, nextNoteTimeRef.current);
        gain.gain.linearRampToValueAtTime(0.05, nextNoteTimeRef.current + duration * 0.3);
        gain.gain.linearRampToValueAtTime(0.02, nextNoteTimeRef.current + duration * 0.7);
        gain.gain.linearRampToValueAtTime(0, nextNoteTimeRef.current + duration);
        
        osc.connect(gain);
        gain.connect(effectInputRef.current);
        
        osc.start(nextNoteTimeRef.current);
        osc.stop(nextNoteTimeRef.current + duration);
        
        activeOscillators.current.push(osc);
        osc.onended = () => {
          activeOscillators.current = activeOscillators.current.filter(o => o !== osc);
        };
      };

      const schedule = () => {
        if (!ctxRef.current) return;
        
        while (nextNoteTimeRef.current < ctxRef.current.currentTime + 1.0) {
          const currentStyle = styleRef.current;
          
          if (currentStyle === 'nature') {
            nextNoteTimeRef.current += 1;
            continue;
          }

          let scale: number[] = [];
          let duration = 4;
          let interval = 2;
          let type: OscillatorType = 'sine';

          if (currentStyle === 'emotional') {
            // C Minor Pentatonic: C, Eb, F, G, Bb
            scale = [261.63, 311.13, 349.23, 392.00, 466.16];
            duration = 6 + Math.random() * 4;
            interval = 2 + Math.random() * 2;
            type = 'sine';
          } else if (currentStyle === 'motivational') {
            // C Major Pentatonic: C, D, E, G, A
            scale = [261.63, 293.66, 329.63, 392.00, 440.00];
            duration = 3 + Math.random() * 3;
            interval = 1 + Math.random() * 1.5;
            type = 'triangle';
          } else if (currentStyle === 'inspirational') {
            // C Lydian-ish (C, E, G, B, D)
            scale = [261.63, 329.63, 392.00, 493.88, 587.33];
            duration = 5 + Math.random() * 5;
            interval = 1.5 + Math.random() * 2;
            type = 'sine';
          }

          const baseFreq = scale[Math.floor(Math.random() * scale.length)];
          const octave = Math.random() > 0.5 ? 0.5 : (Math.random() > 0.8 ? 2 : 1);
          
          playNote(baseFreq * octave, duration, type);
          
          if (Math.random() > 0.6) {
            const harmFreq = scale[Math.floor(Math.random() * scale.length)];
            playNote(harmFreq * octave, duration * 1.2, type);
          }

          nextNoteTimeRef.current += interval;
        }
        timerRef.current = window.setTimeout(schedule, 100);
      };

      schedule();
    }

    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(console.error);
    }

  }, [isPlaying]);

  useEffect(() => {
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(isMuted ? 0 : 0.15, ctxRef.current.currentTime, 0.1);
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (ctxRef.current) {
        ctxRef.current.close().catch(console.error);
      }
    };
  }, []);
}
