// Level 2, page 6 practice voice notes: the manager (accounting track) and the customer (service track),
// each as a clear take and a noisy one (car horns / TV and kids). Output: public/assets/practice/voice-*.mp3
//
// Voices are Microsoft Edge neural TTS (ar-EG-ShakirNeural, ar-EG-SalmaNeural) — fictional people, said so on the page.
// Needs msedge-tts in a temp folder (not a project dependency) and ffmpeg on PATH:
//   cd <temp> && npm i msedge-tts@2 && node <repo>/scripts/generate-voice-notes-l2.mjs <repo>/public/assets/practice
// The service rate-limits (HTTP 429): the script waits between voices; rerun it to fill in what's missing.
// The page transcripts in src/data/unit2Data.ts must match these texts (D-101 → «دي مية وواحد», NS-5603 digit by digit).
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const OUT = process.argv[2]
if (!OUT) throw new Error('usage: node generate-voice-notes-l2.mjs <output folder>')
const WORK = fs.mkdtempSync('voice-l2-')

const voices = [
    { name: 'manager', voice: 'ar-EG-ShakirNeural', rate: '+12%', text: 'أيوه يا أحمد، معلش أنا سايق... بص، عايزك تجهزلي ملخص مصروفات أكتوبر، بس ركّز على الشحن، عشان زاد قوي الشهر ده. وكلّم دلتا بخصوص الفاتورة اللي الضريبة فيها غلط، أظن رقمها دي مية وواحد كده... ولا مية وعشرة؟ مش فاكر، شوفها إنت. وعايز التقرير قبل اجتماع الحد... لأ استنى، الاجتماع اتقدّم للخميس، يبقى الأربع بالليل بالكتير. آه، وحاجة أخيرة: متدفعش لسريع للشحن حاجة غير لما أرجع. سلام.' },
    { name: 'customer', voice: 'ar-EG-SalmaNeural', rate: '+12%', text: 'ألو... أيوه، السلام عليكم. أنا عملت أوردر من عندكم، رقمه إن إس، خمسة، ستة، صفر، تلاتة... مفرش السفرة... المفرش جه مقاس سمول، وأنا كنت طالبة لارج خالص. أنا فتحت الكرتونة بس، ماستعملتهوش، هو لسه في الكيس بتاعه. فأنا عايزة أبدّله، ولو مش هينفع خلاص، رجّعولي الفلوس. وياريت بسرعة، عشان عندي عزومة يوم الجمعة. وكمان... اللي جه سلّمه كان قليل الذوق شوية بصراحة. شكراً.' },
    // background TV for the noisy customer take (also pitched up into «kids»)
    { name: 'tv', voice: 'ar-EG-SalmaNeural', rate: '+5%', text: 'وده كان موجز الأخبار، وبعد الفاصل نرجع لكم بأحلى الأغاني. خليكوا معانا، العرض مستمر طول اليوم، اتصل دلوقتي واكسب جايزة كبيرة. الجو بكرة حار نهاراً معتدل ليلاً على القاهرة الكبرى والوجه البحري.' },
]

const raw = {}
for (const [i, v] of voices.entries()) {
    if (i) await new Promise(r => setTimeout(r, 25000))
    const tts = new MsEdgeTTS()
    await tts.setMetadata(v.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
    const dir = path.join(WORK, v.name)
    fs.mkdirSync(dir)
    raw[v.name] = (await tts.toFile(dir, v.text, { rate: v.rate })).audioFilePath
    tts.close()
}

const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' })
const enc = ['-ac', '1', '-ar', '24000', '-b:a', '64k']

ff(['-i', raw.manager, '-af', 'highpass=f=80', ...enc, path.join(OUT, 'voice-manager-clear.mp3')])
ff(['-i', raw.customer, '-af', 'highpass=f=80', ...enc, path.join(OUT, 'voice-customer-clear.mp3')])

// Manager in the car: engine rumble, wind, and horns (one over «ولا مية وعشرة»).
ff(['-i', raw.manager,
    '-f', 'lavfi', '-i', 'anoisesrc=color=brown:amplitude=0.6:duration=38:sample_rate=24000',
    '-f', 'lavfi', '-i', 'anoisesrc=color=pink:amplitude=0.25:duration=38:sample_rate=24000',
    '-f', 'lavfi', '-i', "aevalsrc='0.22*(sin(2*PI*415*t)+sin(2*PI*523*t)+0.4*sin(2*PI*830*t))*(between(t,4.5,4.9)+between(t,5.1,5.7)+between(t,16.0,16.9)+between(t,31.0,31.35))':s=24000:d=38",
    '-filter_complex', "[1]lowpass=f=220,volume=1.6[eng];[2]highpass=f=600,lowpass=f=3000,volume='0.5+0.4*sin(2*PI*t/7)':eval=frame[wind];[3]lowpass=f=2500[horn];[0]highpass=f=150,lowpass=f=3400[v];[v][eng][wind][horn]amix=inputs=4:normalize=0:duration=first,alimiter=limit=0.95[out]",
    '-map', '[out]', ...enc, path.join(OUT, 'voice-manager-noisy.mp3')])

// Customer at home: TV in the room, kids on and off, room hiss.
const kids = path.join(WORK, 'kids.wav')
ff(['-i', raw.tv, '-filter_complex', '[0]aloop=loop=2:size=1000000,asetrate=24000*1.45,aresample=24000,atempo=1.1[k]', '-map', '[k]', '-t', '40', kids])
ff(['-i', raw.customer, '-stream_loop', '-1', '-i', raw.tv, '-i', kids,
    '-f', 'lavfi', '-i', 'anoisesrc=color=pink:amplitude=0.12:duration=40:sample_rate=24000',
    '-filter_complex', "[1]highpass=f=300,lowpass=f=3500,aecho=0.6:0.5:40:0.3,volume=0.32[tv];[2]volume='0.30*(gt(sin(2*PI*t/5.5),0.2))':eval=frame,lowpass=f=4000[kids];[0]lowpass=f=3800[v];[v][tv][kids][3]amix=inputs=4:normalize=0:duration=first,alimiter=limit=0.95[out]",
    '-map', '[out]', ...enc, path.join(OUT, 'voice-customer-noisy.mp3')])

fs.rmSync(WORK, { recursive: true, force: true })
console.log('done:', fs.readdirSync(OUT).filter(f => f.startsWith('voice-')).join(', '))
