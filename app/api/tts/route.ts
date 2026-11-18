import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { alphabet } from "../../oxford-phonics-world/level-1/lesson-content";

const run = promisify(execFile);
const cache = new Map<string, Uint8Array>();
const pending = new Map<string, Promise<Uint8Array>>();
const voice = "en-US-JennyNeural";

// The lesson is public, so only synthesize phrases its controls can play.
const lessonPhrases = new Set(alphabet.flatMap(({ letter, words }) =>
  words.flatMap(({ word }) => [
    word,
    `${letter}, ${word}`,
    `Which one is ${word}?`,
  ]),
));

async function synthesize(text: string): Promise<Uint8Array> {
  const python = process.env.TTS_PYTHON || (process.platform === "win32" ? ".venv\\Scripts\\python.exe" : ".venv/bin/python");
  const { stdout } = await run(python, [path.join(process.cwd(), "scripts/tts.py"), text, voice], {
    encoding: "buffer", timeout: 20_000, maxBuffer: 2 * 1024 * 1024,
  });
  if (!stdout.length) throw new Error("No audio returned");
  const audio = new Uint8Array(stdout);
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(text, audio);
  return audio;
}

export async function GET(request: Request) {
  const text = new URL(request.url).searchParams.get("text")?.trim();
  if (!text || text.length > 200 || /[\u0000-\u001f\u007f]/.test(text)) {
    return Response.json({ error: "Từ vựng phải có từ 1 đến 200 ký tự." }, { status: 400 });
  }
  if (!lessonPhrases.has(text)) {
    return Response.json({ error: "Nội dung phát âm phải thuộc bài học." }, { status: 400 });
  }

  try {
    let audio = cache.get(text);
    if (!audio) {
      let task = pending.get(text);
      if (!task) {
        if (pending.size >= 4) return Response.json({ error: "Đang bận, vui lòng thử lại." }, { status: 429 });
        task = synthesize(text).finally(() => pending.delete(text));
        pending.set(text, task);
      }
      audio = await task;
    }
    return new Response(new Uint8Array(audio), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    return Response.json({ error: "Chưa đọc được từ này. Vui lòng thử lại." }, { status: 503 });
  }
}
