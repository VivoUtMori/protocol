import { useState, useEffect, useRef, useCallback } from 'react';

export interface TranscriptChunk {
    timestamp: [number, number];
    text: string;
    speaker: string;
}

export function useTranscription() {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState<string>('');
    const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
    const [progress, setProgress] = useState<{ status: string, progress?: number, file?: string } | null>(null);

    const worker = useRef<Worker | null>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    // Initialize Worker
    useEffect(() => {
        if (!worker.current) {
            worker.current = new Worker(new URL('../workers/whisper.worker.ts', import.meta.url), {
                type: 'module'
            });

            worker.current.addEventListener('message', (e) => {
                switch (e.data.type) {
                    case 'progress':
                        setProgress(e.data.data);
                        break;
                    case 'complete':
                        setTranscript(e.data.result.text);
                        setChunks(e.data.result.chunks);
                        setIsTranscribing(false);
                        setProgress(null);
                        break;
                    case 'error':
                        console.error('Transcription error:', e.data.error);
                        setIsTranscribing(false);
                        setProgress({ status: 'error' });
                        break;
                }
            });
        }

        return () => {
            worker.current?.terminate();
            worker.current = null;
        };
    }, []);

    const decodeAudioData = async (audioBlob: Blob): Promise<Float32Array> => {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new window.AudioContext({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer.getChannelData(0);
    };

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                // Clean up stream tracks
                stream.getTracks().forEach(track => track.stop());

                // Prepare audio for whisper (Float32Array resampled to 16kHz)
                setIsTranscribing(true);
                const floatAudio = await decodeAudioData(audioBlob);

                worker.current?.postMessage({
                    type: 'transcribe',
                    audio: floatAudio
                });
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            setTranscript(''); // reset
            setChunks([]);
        } catch (err) {
            console.error('Failed to start recording:', err);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    return {
        isRecording,
        isTranscribing,
        progress,
        transcript,
        chunks,
        startRecording,
        stopRecording
    };
}
