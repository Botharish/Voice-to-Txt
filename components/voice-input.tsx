"use client";

import { GoogleGenAI, Modality, type Session } from "@google/genai";
import { useEffect, useRef, useState } from "react";
import { romanizeTamil } from "@/lib/tamil-transliteration";

interface VoiceInputProps {
  text: string;
  onTextChange: (text: string) => void;
}

interface LiveTokenResponse {
  token?: string;
  model?: string;
  error?: string;
}

const maxTranscriptLength = 1000;
const targetSampleRate = 16_000;

export default function VoiceInput({
  text,
  onTextChange,
}: VoiceInputProps) {
  const sessionRef = useRef<Session | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const listeningRef = useRef(false);
  const finalTranscriptRef = useRef(text);
  const interimTranscriptRef = useRef("");
  const [isListening, setIsListening] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    finalTranscriptRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!isListening) return;

    const timer = window.setInterval(
      () => setElapsedSeconds((seconds) => seconds + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [isListening]);

  function updateTranscript() {
    const transcript = `${finalTranscriptRef.current}${interimTranscriptRef.current}`;
    onTextChange(romanizeTamil(transcript).slice(0, maxTranscriptLength));
  }

  function releaseMicrophone() {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext && audioContext.state !== "closed") {
      void audioContext.close();
    }
  }

  function stopListening(signalStreamEnd = true) {
    requestIdRef.current += 1;
    listeningRef.current = false;
    setIsListening(false);
    releaseMicrophone();

    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) {
      if (signalStreamEnd) {
        session.sendRealtimeInput({ audioStreamEnd: true });
        closeTimerRef.current = window.setTimeout(() => {
          session.close();
          closeTimerRef.current = null;
        }, 750);
      } else {
        session.close();
      }
    }

    setStatus("Voice input stopped.");
  }

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      releaseMicrophone();
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      sessionRef.current?.close();
      sessionRef.current = null;
    };
  }, []);

  async function startListening() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Microphone access is not available in this browser.");
      return;
    }

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const requestId = ++requestIdRef.current;
    listeningRef.current = true;
    setIsListening(true);
    interimTranscriptRef.current = "";
    setElapsedSeconds(0);
    setStatus("Requesting microphone access…");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (requestIdRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      setStatus("Connecting to live transcription…");
      const response = await fetch("/api/live-token", { method: "POST" });
      if (requestIdRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const tokenData = (await response.json()) as LiveTokenResponse;
      if (!response.ok || !tokenData.token || !tokenData.model) {
        throw new Error(
          tokenData.error ?? "Could not start voice transcription. Please try again.",
        );
      }

      const ai = new GoogleGenAI({
        apiKey: tokenData.token,
        httpOptions: { apiVersion: "v1beta" },
      });
      const session = await ai.live.connect({
        model: tokenData.model,
        config: {
          responseModalities: [Modality.TEXT],
          inputAudioTranscription: { languageCodes: [] },
        },
        callbacks: {
          onmessage: (message) => {
            const content = message.serverContent;
            if (content?.interimInputTranscription?.text) {
              interimTranscriptRef.current =
                content.interimInputTranscription.text;
              updateTranscript();
            }

            if (content?.inputTranscription?.text) {
              const nextText = content.inputTranscription.text;
              const currentText = finalTranscriptRef.current;
              const separator =
                currentText && !/\s$/u.test(currentText) ? " " : "";
              finalTranscriptRef.current = `${currentText}${separator}${nextText}`;
              interimTranscriptRef.current = "";
              updateTranscript();
            }
          },
          onerror: () => {
            if (listeningRef.current) {
              stopListening(false);
              setStatus("Live transcription disconnected. Tap the microphone to try again.");
            }
          },
          onclose: () => {
            if (listeningRef.current) {
              requestIdRef.current += 1;
              listeningRef.current = false;
              releaseMicrophone();
              sessionRef.current = null;
              setIsListening(false);
              setStatus("Live transcription disconnected. Tap the microphone to try again.");
            }
          },
        },
      });

      if (requestIdRef.current !== requestId) {
        session.close();
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      sessionRef.current = session;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      await audioContext.resume();

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const mutedOutput = audioContext.createGain();
      mutedOutput.gain.value = 0;
      sourceRef.current = source;
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!listeningRef.current || sessionRef.current !== session) return;

        const samples = downsample(
          event.inputBuffer.getChannelData(0),
          audioContext.sampleRate,
          targetSampleRate,
        );
        session.sendRealtimeInput({
          audio: {
            data: toBase64Pcm(samples),
            mimeType: `audio/pcm;rate=${targetSampleRate}`,
          },
        });
      };

      source.connect(processor);
      processor.connect(mutedOutput);
      mutedOutput.connect(audioContext.destination);

      setStatus("Listening for Tamil or English…");
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      releaseMicrophone();
      sessionRef.current?.close();
      sessionRef.current = null;
      listeningRef.current = false;
      setIsListening(false);

      const errorName =
        error instanceof DOMException ? error.name : "";
      setStatus(
        errorName === "NotAllowedError"
          ? "Allow microphone access in your browser to use voice input."
          : errorName === "NotFoundError"
            ? "No microphone was found. Check your audio input and try again."
            : error instanceof Error
              ? error.message
              : "Could not start voice input. Please try again.",
      );
    }
  }

  const formattedTime = `${Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(elapsedSeconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="voice-input">
      <button
        className={`voice-button${isListening ? " is-listening" : ""}`}
        type="button"
        onClick={() => (isListening ? stopListening() : startListening())}
        aria-label={isListening ? "Stop live voice input" : "Start speaking"}
        aria-pressed={isListening}
      >
        {isListening ? (
          <span className="voice-stop-icon" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect
              x="7"
              y="2.5"
              width="6"
              height="10"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5m-3 0h6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      <span className="voice-status" aria-live="polite">
        {status || (isListening ? `Listening · ${formattedTime}` : "Tap to speak")}
      </span>
      {isListening && (
        <span className="voice-wave" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      )}
    </div>
  );
}

function downsample(
  input: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number,
): Int16Array {
  const outputLength = Math.floor(
    (input.length * outputSampleRate) / inputSampleRate,
  );
  const output = new Int16Array(outputLength);
  const ratio = inputSampleRate / outputSampleRate;

  for (let index = 0; index < outputLength; index += 1) {
    const start = Math.floor(index * ratio);
    const end = Math.min(Math.floor((index + 1) * ratio), input.length);
    let total = 0;
    for (let sample = start; sample < end; sample += 1) {
      total += input[sample];
    }

    const average = total / Math.max(end - start, 1);
    const clipped = Math.max(-1, Math.min(1, average));
    output[index] = clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff;
  }

  return output;
}

function toBase64Pcm(samples: Int16Array): string {
  const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}
