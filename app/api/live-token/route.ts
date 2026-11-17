import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";

const model = "gemini-3.5-transcribe-live";

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const message =
      process.env.VERCEL === "1"
        ? "Add GEMINI_API_KEY in Vercel Project Settings → Environment Variables for Production, then redeploy."
        : "Add GEMINI_API_KEY to .env.local and restart the development server.";

    return NextResponse.json(
      { error: message },
      { status: 503 },
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1beta" },
    });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        newSessionExpireTime: new Date(Date.now() + 60_000).toISOString(),
        expireTime: new Date(Date.now() + 30 * 60_000).toISOString(),
        liveConnectConstraints: {
          model,
          config: {
            responseModalities: [Modality.TEXT],
            inputAudioTranscription: { languageCodes: ["ta-IN", "en-IN"] },
          },
        },
      },
    });

    if (!token.name) {
      console.error("Gemini did not return an ephemeral Live API token.");
      return NextResponse.json(
        { error: "Could not start voice transcription. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ token: token.name, model });
  } catch (error) {
    console.error("Unable to create a Gemini Live API token.", error);
    return NextResponse.json(
      { error: "Could not start voice transcription. Please try again." },
      { status: 502 },
    );
  }
}
