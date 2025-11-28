import { useState, useEffect, useRef } from 'react';

export const useAudioActivity = (stream, threshold = -50) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const rafIdRef = useRef(null);

    useEffect(() => {
        if (!stream || !stream.getAudioTracks().length) {
            setIsSpeaking(false);
            return;
        }

        const initAudio = () => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;

                if (!audioContextRef.current) {
                    audioContextRef.current = new AudioContext();
                }

                if (audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume();
                }

                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 512;
                analyserRef.current.smoothingTimeConstant = 0.4;

                sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                sourceRef.current.connect(analyserRef.current);

                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                const checkAudio = () => {
                    if (!analyserRef.current) return;

                    analyserRef.current.getByteFrequencyData(dataArray);

                    // Calculate average volume
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / bufferLength;

                    // Convert to dB-like scale (approximate) or just use raw value
                    // 0 to 255. 0 is silence.
                    // Threshold of -50dB is roughly equivalent to a low value in 0-255 scale.
                    // Let's use a simple threshold on the average value.
                    // 10-20 is usually background noise. > 30 is likely speech.

                    setIsSpeaking(average > 15); // Adjust this threshold as needed

                    rafIdRef.current = requestAnimationFrame(checkAudio);
                };

                checkAudio();
            } catch (error) {
                console.error('Error initializing audio activity detection:', error);
            }
        };

        initAudio();

        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }
            // Do not close AudioContext as it might be shared or expensive to recreate constantly
            // But for this hook, we created it, so we should probably close it if we are sure we are done.
            // However, in React strict mode or frequent re-renders, closing/opening can be buggy.
            // Let's just disconnect the source.
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(e => console.error(e));
                audioContextRef.current = null;
            }
        };
    }, [stream]);

    return isSpeaking;
};
