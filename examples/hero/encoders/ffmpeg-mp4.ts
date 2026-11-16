import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { AnimationEncoder } from './port.js';

/** H.264 MP4 through ffmpeg (libx264): full colour, the smallest file, and it plays anywhere video does. */
export const FFMPEG_MP4: AnimationEncoder = {
  name: 'ffmpeg (H.264 MP4)',
  extensions: ['.mp4'],
  open(out, { width, height, delayCs }) {
    mkdirSync(dirname(out), { recursive: true });
    const ffmpeg = spawn('ffmpeg', [
      '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${String(width)}x${String(height)}`,
      '-r', String(100 / delayCs), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const exited = new Promise<number | null>((resolve) => { ffmpeg.on('close', resolve); });
    return {
      async add(rgba) {
        if (!ffmpeg.stdin.write(rgba)) await once(ffmpeg.stdin, 'drain');
      },
      async close() {
        ffmpeg.stdin.end();
        const code = await exited;
        if (code !== 0) throw new Error(`ffmpeg exited with ${String(code)}`);
      },
    };
  },
};
