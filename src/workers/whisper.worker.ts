import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are running in browser
env.allowLocalModels = false;
env.useBrowserCache = true;

class PipelineFactory {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny.en';
    static instance: any = null;

    static async getInstance(progress_callback: any = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task as any, this.model, {
                progress_callback
            });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    if (type === 'transcribe' && audio) {
        try {
            const transcriber = await PipelineFactory.getInstance((data: any) => {
                // Send model loading progress back to UI
                self.postMessage({ type: 'progress', data });
            });

            // Perform transcription matching speaker labels (diarization is complex
            // purely in-browser, so for this MVP we append generic clustering based on chunk intervals)
            // The `return_timestamps` flag helps chunk the audio into segments.
            const result = await transcriber(audio, {
                chunk_length_s: 30,
                stride_length_s: 5,
                return_timestamps: true,
            });

            // Simple pseudo-diarization logic based on chunking for demonstration layout
            const labeledChunks = result.chunks?.map((chunk: any, index: number) => {
                // In a real sophisticated diarization model, we'd cluster embeddings here.
                // For local whisper, we alternate or assign a default "Speaker 1"
                return {
                    ...chunk,
                    speaker: `Speaker 1` // Placeholder: actual diarization requires a separate clustering model.
                }
            }) || [];

            self.postMessage({
                type: 'complete',
                result: { text: result.text, chunks: labeledChunks }
            });
        } catch (error: any) {
            self.postMessage({ type: 'error', error: error.message });
        }
    }
});
