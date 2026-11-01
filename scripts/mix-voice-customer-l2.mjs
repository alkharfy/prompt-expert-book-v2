// Level 2, page 6: the customer's voice note from the owner's ElevenLabs recording (voice «Heba», 2026-10-29),
// which replaced the Edge TTS take from generate-voice-notes-l2.mjs (owner 2026-11-01: «الفويسات في أمثلة منى وحشة»).
// Writes the clear take and the at-home take (TV murmuring in the room).
//   node scripts/mix-voice-customer-l2.mjs <recording.mp3> public/assets/practice
// The TV is the recording itself played backwards, slowed and muffled, so it sounds like talk through a wall and
// never says a real word over hers; the old pitched-up TTS «kids» are gone (they sounded fake).
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const [input, out] = process.argv.slice(2)
if (!input || !out) throw new Error('usage: node mix-voice-customer-l2.mjs <recording> <output folder>')

const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' })
const enc = ['-ac', '1', '-ar', '24000', '-b:a', '64k']
const seconds = 30

ff(['-i', input, '-af', 'highpass=f=80', ...enc, path.join(out, 'voice-customer-clear.mp3')])

ff(['-i', input, '-i', input,
    '-f', 'lavfi', '-i', `anoisesrc=color=pink:amplitude=0.08:duration=${seconds}:sample_rate=24000`,
    '-filter_complex', [
        '[1]areverse,aresample=24000,asetrate=24000*0.82,aresample=24000,aloop=loop=1:size=900000,highpass=f=180,lowpass=f=1100,aecho=0.7:0.6:60|110:0.35|0.2,volume=1.1[tv]',
        '[2]lowpass=f=5000[room]',
        '[0]aresample=24000,lowpass=f=3800[v]',
        '[v][tv][room]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.95[out]',
    ].join(';'),
    '-map', '[out]', ...enc, path.join(out, 'voice-customer-noisy.mp3')])

console.log('done: voice-customer-clear.mp3, voice-customer-noisy.mp3')
