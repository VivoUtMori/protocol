/**
 * Web Worker for Whisper Transcription
 * Uses @xenova/transformers for client-side ML.
 */

// Shims for browser environment compatibility in Web Workers
const shim = () => {
    // @ts-ignore
    self.window = self;
    // @ts-ignore
    if (typeof self.process === 'undefined') {
        // @ts-ignore
        self.process = { env: { NODE_ENV: 'production' }, browser: true };
    }
};

shim();

let transformersPromise: Promise<any> | null = null;

/**
 * Initialize transformers library using the bundled dist version
 * to avoid Node.js dependency conflicts in Next.js/Turbopack.
 */
async function initTransformers() {
    try {
        // @ts-ignore
        const transformers = await import('@xenova/transformers/dist/transformers.js');
        const T = transformers.default || transformers;

        // Configure environment
        T.env.allowLocalModels = false;
        T.env.useBrowserCache = true;

        return T;
    } catch (error: any) {
        console.error('Transcription Worker: Failed to load transformers', error);
        self.postMessage({ type: 'error', error: 'Failed to load transcription engine: ' + error.message });
        throw error;
    }
}

async function getTransformers() {
    if (!transformersPromise) {
        transformersPromise = initTransformers();
    }
    return transformersPromise;
}

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    if (type === 'transcribe' && audio) {
        try {
            const { pipeline } = await getTransformers();

            // Get or create the pipeline instance
            const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
                progress_callback: (data: any) => {
                    self.postMessage({ type: 'progress', data });
                }
            });

            // Signal starting inference
            self.postMessage({ type: 'progress', data: { status: 'transcribing' } });

            const result = await transcriber(audio, {
                chunk_length_s: 30,
                stride_length_s: 5,
                return_timestamps: true,
            });

            // Simple pseudo-diarization for UI demonstration
            const labeledChunks = result.chunks?.map((chunk: any) => ({
                ...chunk,
                speaker: 'Speaker' // Default label
            })) || [];

            self.postMessage({
                type: 'complete',
                result: {
                    text: result.text,
                    chunks: labeledChunks
                }
            });
        } catch (error: any) {
            console.error('Transcription Worker: Error during processing', error);
            self.postMessage({ type: 'error', error: error.message });
        }
    }
});
