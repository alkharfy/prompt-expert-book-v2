// Level 2, page 6: the manager's voice note from the owner's ElevenLabs recording (voice «Haytham», 2026-10-22),
// which replaced the Edge TTS take from generate-voice-notes-l2.mjs. Writes the clear and the in-the-car takes.
//   node scripts/mix-voice-manager-l2.mjs <recording.mp3> public/assets/practice
// The horns are timed to this recording: one over «ولا 110» on purpose, none over «الأربع بالليل» (the answer check needs it).
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const [input, out] = process.argv.slice(2)
if (!input || !out) throw new Error('usage: node mix-voice-manager-l2.mjs <recording> <output folder>')

const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' })
const enc = ['-ac', '1', '-ar', '24000', '-b:a', '64k']
const seconds = 32

ff(['-i', input, '-af', 'highpass=f=80', ...enc, path.join(out, 'voice-manager-clear.mp3')])

// In the car: engine rumble, wind, and horns at 2.6s and 3.2s («بص عايزك»), 15.9s («ولا 110») and 26.0s («آه»).
ff(['-i', input,
    '-f', 'lavfi', '-i', `anoisesrc=color=brown:amplitude=0.6:duration=${seconds}:sample_rate=24000`,
    '-f', 'lavfi', '-i', `anoisesrc=color=pink:amplitude=0.25:duration=${seconds}:sample_rate=24000`,
    '-f', 'lavfi', '-i', `aevalsrc='0.22*(sin(2*PI*415*t)+sin(2*PI*523*t)+0.4*sin(2*PI*830*t))*(between(t,2.6,3.0)+between(t,3.2,3.8)+between(t,15.9,16.9)+between(t,26.0,26.35))':s=24000:d=${seconds}`,
    '-filter_complex', "[1]lowpass=f=220,volume=1.6[eng];[2]highpass=f=600,lowpass=f=3000,volume='0.5+0.4*sin(2*PI*t/7)':eval=frame[wind];[3]lowpass=f=2500[horn];[0]aresample=24000,highpass=f=150,lowpass=f=3400[v];[v][eng][wind][horn]amix=inputs=4:normalize=0:duration=first,alimiter=limit=0.95[out]",
    '-map', '[out]', ...enc, path.join(out, 'voice-manager-noisy.mp3')])

console.log('done: voice-manager-clear.mp3, voice-manager-noisy.mp3')
