export type SpeechToTextInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  language?: string;
  prompt?: string;
  abortSignal?: AbortSignal;
};

export type SpeechToTextResult = {
  text: string;
  language?: string;
  raw?: unknown;
};

export interface SpeechToTextAdapter {
  name: string;

  validate(): void;

  transcribe(input: SpeechToTextInput): Promise<SpeechToTextResult>;
}

export type TtsAudioFormat =
  | "mp3"
  | "opus"
  | "aac"
  | "flac"
  | "wav"
  | "pcm";

export type TextToSpeechInput<Voice extends string = string> = {
  text: string;
  voice?: Voice;
  format?: TtsAudioFormat;
  speed?: number;
  instructions?: string;
  abortSignal?: AbortSignal;
  stream?: false;
};

export type TextToSpeechResult = {
  audio: Buffer;
  mimeType: string;
  format: TtsAudioFormat;
  raw?: unknown;
};

export type TtsStreamFormat = "audio" | "sse";

export type TextToSpeechStreamInput<Voice extends string = string> =
  Omit<TextToSpeechInput<Voice>, "stream"> & {
    stream: true;
    streamFormat?: TtsStreamFormat;
  };

export type TextToSpeechStreamResult = {
  audioStream: ReadableStream<Uint8Array>;
  mimeType: string;
  format: TtsAudioFormat;
  streamFormat: TtsStreamFormat;
  raw?: unknown;
};

export interface TextToSpeechAdapter<Voice extends string = string> {
  name: string;

  validate(): void;

  synthesize(input: TextToSpeechStreamInput<Voice>): Promise<TextToSpeechStreamResult>;
  synthesize(input: TextToSpeechInput<Voice>): Promise<TextToSpeechResult>;
}

export type AudioAdapter<Voice extends string = string> =
  SpeechToTextAdapter & TextToSpeechAdapter<Voice>;
