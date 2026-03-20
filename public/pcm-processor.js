/**
 * PCM AudioWorklet Processor
 * Converts browser audio (typically 48kHz stereo) to PCM16 24kHz mono
 * required by the OpenAI Realtime API.
 *
 * Sends Int16Array chunks to the main thread via the message port.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // sampleRate is a global inside AudioWorkletGlobalScope
    this._inputRate = sampleRate;
    this._targetRate = 24000;
    this._ratio = this._inputRate / this._targetRate;
    this._position = 0; // fractional position in the input buffer
    this._buffer = []; // accumulate samples before sending
    this._bufferSize = 2400; // 100ms of 24kHz audio (2400 samples × 2 bytes = 4800 bytes)
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    // Mix down to mono: average all available channels
    const channels = input.filter(ch => ch && ch.length > 0);
    const length = channels[0].length;
    const mono = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (const ch of channels) sum += ch[i];
      mono[i] = sum / channels.length;
    }

    // Downsample to 24kHz using linear interpolation
    while (this._position < length) {
      const i = Math.floor(this._position);
      const frac = this._position - i;
      const next = Math.min(i + 1, length - 1);
      const sample = mono[i] * (1 - frac) + mono[next] * frac;

      // Float32 [-1, 1] → Int16 [-32768, 32767]
      this._buffer.push(Math.max(-32768, Math.min(32767, Math.round(sample * 32767))));
      this._position += this._ratio;
    }

    this._position -= length;

    // Send in chunks of _bufferSize (100ms)
    while (this._buffer.length >= this._bufferSize) {
      const chunk = this._buffer.splice(0, this._bufferSize);
      const int16 = new Int16Array(chunk);
      this.port.postMessage({ type: 'pcm', data: int16 }, [int16.buffer]);
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
