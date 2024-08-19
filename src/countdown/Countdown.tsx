import { Major_Mono_Display, Red_Hat_Display } from "next/font/google"
import styles from "./Countdown.module.css"
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

const font_majormono = Major_Mono_Display({ subsets: ["latin"], weight: "400" });
const font_redhat = Red_Hat_Display({ subsets: ["latin"], weight: "400" });

let _actx_: null | AudioContext = null
const actx = () => {
    _actx_ ??= new AudioContext()
    return _actx_
}

export function Countdown({
    until, event_name,
}: {
    until: Date, event_name: string,
}) {
    const [sfx, set_sfx] = useState<SFX | null>(null)
    useEffect(() => {
        return () => sfx?.destroy()
    }, [sfx])

    const dref = useRef<HTMLDivElement>(null)
    const href = useRef<HTMLDivElement>(null)
    const mref = useRef<HTMLDivElement>(null)
    const sref = useRef<HTMLDivElement>(null)

    const [time_left, set_time_left] = useState<number | null>(null)
    useEffect(() => {
        let id = -1 as unknown as NodeJS.Timeout
        const set = () => setTimeout(() => {
            const left = Math.max(-1, Math.round((until.getTime() - Date.now()) / 1000))
            set_time_left(left)
            if (left === 1) {
                setTimeout(() => {
                    new EndSFX()
                }, 1500)
            }
            if (left > 0) {
                sfx?.tick(
                    (left - 1) % (60 * 60 * 24) === 0
                        ? 3
                        : (left - 1) % (60 * 60) === 0
                            ? 2
                            : (left - 1) % 60 === 0
                                ? 1
                                : 0
                )

                sref.current?.getAnimations().find(v => (v.id || (v as any).animationName) === styles.pulse)?.play()
                if (left % 60 === 0) mref.current?.getAnimations().find(v => (v.id || (v as any).animationName) === styles.pulse_long)?.play()
                if (left % (60 * 60) === 0) href.current?.getAnimations().find(v => (v.id || (v as any).animationName) === styles.pulse_long)?.play()
                if (left % (60 * 60 * 24) === 0) dref.current?.getAnimations().find(v => (v.id || (v as any).animationName) === styles.pulse_long)?.play()
            } else {
                // silence
            }
            id = set()
        }, 1000 - Date.now() % 1000);
        id = set()
        return () => clearTimeout(id)
    }, [until, sfx])

    if (time_left == null) return <></>

    const days = Math.floor(time_left / 60 / 60 / 24)
    const hours = Math.floor(time_left / 60 / 60) % 24
    const minutes = Math.floor(time_left / 60) % 60
    const seconds = time_left % 60
    return (
        <div className={styles.a} onClick={sfx == null ? e => { set_sfx(new SFX()) } : undefined}>
            <div className={`${styles.b} ${font_majormono.className}`}>
                <div className={styles.header}>
                    {`[>> ${event_name} <<]`}
                </div>
                <div className={styles.spacer} />
                <div className={styles.counter}>
                    {time_left >= 0 ? <>
                        {
                            hours > 0 || days > 0 ? <>
                                {days > 0 ? <>
                                    <div ref={dref}>{days.toString().padStart(3, "0")} dys</div>
                                </> : null}
                                <div ref={href}>{hours.toString().padStart(3, "0")} hrs</div>
                            </> : null
                        }
                        <div ref={mref}>{minutes.toString().padStart(3, "0")} min</div>
                        <div ref={sref}>{seconds.toString().padStart(3, "0")} sec</div>
                    </> : <>IS HERE!</>}
                </div>
                <div className={styles.spacer} />
                {sfx == null && <div className={styles.sound_disabled_indicator}> sound disabled </div>}
            </div>
        </div>
    )
}

function genconvbuf(len = 0.5): AudioBuffer {
    const actx = _actx_!
    const aubuf = new AudioBuffer({ length: actx.sampleRate * len, sampleRate: actx.sampleRate, numberOfChannels: 2 })
    for (let ch_i = 0; ch_i < aubuf.numberOfChannels; ch_i++) {
        const ch = aubuf.getChannelData(ch_i)
        // ch[0] = 1.0
        for (let i = 0; i < ch.length; i++) {
            ch[i] = Math.exp(-i / actx.sampleRate * 1000)
                + Math.random() * Math.exp(-i / actx.sampleRate * 100)
                + 0.5 * Math.random() * Math.exp(-i / actx.sampleRate * 10)
                + 0.1 * Math.random() * Math.exp(-i / actx.sampleRate * 3)
                + 0.01 * Math.random() * Math.exp(-i / actx.sampleRate * 0.5)
            // ch[i] = Math.exp(-i / actx.sampleRate * 1) * ((i / actx.sampleRate * Math.PI * 2 * 1) % 1 - 0.5)
            // ch[i] = (Math.exp(-i / actx.sampleRate * 1)) * 0.1 * (
            //     ((i / actx.sampleRate / 4.02 * 400) % 1 - 0.5)
            //     + 0.5 * ((i / actx.sampleRate / 4.02 * 399) % 1 - 0.5)
            //     + 0.5 * ((i / actx.sampleRate / 4.02 * 401) % 1 - 0.5)
            //     + ((i / actx.sampleRate / 4.02 * 400 * (2) ** (5 / 12)) % 1 - 0.5)
            //     + 0.5 * ((i / actx.sampleRate / 4.02 * 399 * (2) ** (5 / 12)) % 1 - 0.5)
            //     + 0.5 * ((i / actx.sampleRate / 4.02 * 401 * (2) ** (5 / 12)) % 1 - 0.5)
            //     + ((i / actx.sampleRate / 4.02 * 400 * (2) ** (7 / 12)) % 1 - 0.5)
            //     + 0.5 * ((i / actx.sampleRate / 4.02 * 399 * (2) ** (7 / 12)) % 1 - 0.5)
            //     + 0.5 * ((i / actx.sampleRate / 4.02 * 401 * (2) ** (7 / 12)) % 1 - 0.5)
            // )
        }
    }
    return aubuf
}
function genconvbuf_chonk(len = 1.0): AudioBuffer {
    const actx = _actx_!
    const aubuf = new AudioBuffer({ length: actx.sampleRate * len, sampleRate: actx.sampleRate, numberOfChannels: 2 })
    for (let ch_i = 0; ch_i < aubuf.numberOfChannels; ch_i++) {
        const ch = aubuf.getChannelData(ch_i)
        // ch[0] = 1.0
        for (let i = 0; i < ch.length; i++) {
            ch[i] =
                1.0 * Math.random() * Math.exp(-i / actx.sampleRate * 1)
                + 0.5 * Math.random() * Math.exp(-i / actx.sampleRate * 10)
            // 20 * Math.random() * Math.exp(-i / actx.sampleRate * 0.01)
        }
    }
    return aubuf
}
class SFX {
    readonly osc = new OscillatorNode(actx(), { frequency: 500, type: "square" })
    readonly osc1 = new OscillatorNode(actx(), { frequency: 500, type: "sine" })
    readonly gain = new GainNode(actx(), { gain: 0 })
    readonly conv = new ConvolverNode(actx(), { buffer: genconvbuf() })
    constructor() {
        this.osc1.connect(this.gain)
        this.osc.connect(this.gain).connect(this.conv).connect(actx().destination)
        this.osc.start()
        this.osc1.start()
        actx().resume()
    }
    tick(level: number) {
        if (actx().state == "suspended") actx().resume()
        const time = actx().currentTime + 0.95
        switch (level) {
            case 0:
                this.osc.frequency.setValueAtTime(400.0, time + 0.0)
                this.osc.frequency.setValueAtTime(600.0, time + 0.1)
                this.osc1.frequency.setValueAtTime(201.0, time + 0.0)
                this.osc1.frequency.setValueAtTime(151.0, time + 0.1)
                this.gain.gain.setValueAtTime(0.0, time + 0.0)
                this.gain.gain.linearRampToValueAtTime(0.6, time + 0.01)
                this.gain.gain.linearRampToValueAtTime(0.6, time + 0.05)
                this.gain.gain.exponentialRampToValueAtTime(1e-6, time + 0.8)
                this.gain.gain.linearRampToValueAtTime(0.0, time + 0.9)
                break
            case 1:
                this.osc.frequency.setValueAtTime(400.0, time + 0.0)
                this.osc.frequency.setValueAtTime(600.0, time + 0.1)
                this.osc.frequency.setValueAtTime(400.0, time + 0.2)
                this.osc.frequency.setValueAtTime(1200.0, time + 0.3)
                this.osc.frequency.setValueAtTime(800.0, time + 0.4)
                this.osc.frequency.setValueAtTime(1600.0, time + 0.5)
                this.osc.frequency.setValueAtTime(3200.0, time + 0.6)
                this.osc.frequency.setValueAtTime(1200.0, time + 0.7)
                this.osc.frequency.setValueAtTime(600.0, time + 0.8)
                this.osc1.frequency.setValueAtTime(201.0, time + 0.0)
                this.osc1.frequency.setValueAtTime(151.0, time + 0.1)
                this.osc1.frequency.setValueAtTime(201.0, time + 0.3)
                this.osc1.frequency.setValueAtTime(301.0, time + 0.5)
                this.osc1.frequency.setValueAtTime(401.0, time + 0.7)
                this.osc1.frequency.setValueAtTime(601.0, time + 0.9)
                this.gain.gain.setValueAtTime(0.0, time + 0.0)
                this.gain.gain.linearRampToValueAtTime(0.6, time + 0.05)
                this.gain.gain.exponentialRampToValueAtTime(1e-1, time + 0.8)
                this.gain.gain.linearRampToValueAtTime(0.0, time + 0.9)
                break
            case 2:
                for (let i = 0; i < 5; i++) {
                    this.osc.frequency.setValueAtTime(400.0 * 2 ** (([0, 5, 7, 9, 12][i]) / 12), time + 0.0 + i * 0.2)
                    this.osc1.frequency.setValueAtTime(600.0, time + 0.0 + i * 0.2)
                    this.osc1.frequency.setValueAtTime(1200.0, time + 0.1 + i * 0.2)

                    this.gain.gain.setValueAtTime(0.0, time + 0.0 + i * 0.2)
                    this.gain.gain.linearRampToValueAtTime(0.6, time + 0.01 + i * 0.2)
                    this.gain.gain.exponentialRampToValueAtTime(1e-1, time + 0.18 + i * 0.2)
                }
                this.gain.gain.linearRampToValueAtTime(0.0, time + 0.99)
                break
            case 3:
                for (let i = 0; i < 10; i++) {
                    this.osc.frequency.setValueAtTime(400.0 * 2 ** (([0, 7, 5, 7, 15, 7, 3, 0, 12, -12][i]) / 12), time + 0.0 + i * 0.1)
                    this.osc1.frequency.setValueAtTime(600.0, time + 0.0 + i * 0.1)
                    this.osc1.frequency.setValueAtTime(1200.0, time + 0.05 + i * 0.1)

                }
                this.gain.gain.setValueAtTime(0.0, time + 0.0)
                this.gain.gain.linearRampToValueAtTime(0.6, time + 0.01)
                // this.gain.gain.exponentialRampToValueAtTime(1e-1, time + 0.98)
                this.gain.gain.linearRampToValueAtTime(0.6, time + 0.9)
                this.gain.gain.linearRampToValueAtTime(0.0, time + 0.95)
                break
            case 4:
                for (let i = 0; i < 10; i++) {
                    this.osc.frequency.setValueAtTime(400.0 * 2 ** (([0, 7, 5, 7, 15, 7, 3, 0, 12, -12][i]) / 12), time + 0.0 + i * 0.1)
                    this.osc1.frequency.setValueAtTime(600.0, time + 0.0 + i * 0.1)
                    this.osc1.frequency.setValueAtTime(1200.0, time + 0.05 + i * 0.1)

                }
                this.gain.gain.setValueAtTime(0.0, time + 0.0)
                this.gain.gain.linearRampToValueAtTime(0.6, time + 0.01)
                // this.gain.gain.exponentialRampToValueAtTime(1e-1, time + 0.98)
                this.gain.gain.linearRampToValueAtTime(0.6, time + 0.9)
                this.gain.gain.linearRampToValueAtTime(0.0, time + 0.95)
                break
        }
    }

    destroy() {
        this.osc.disconnect()
        this.osc.stop()
        this.gain.disconnect()
    }
}

function make_osc(base_freq: number, equitemper_note_off: number, detune: number, type: "sine" | "triangle" | "square" | "sawtooth") {
    return new OscillatorNode(actx(), { frequency: base_freq * 2 ** (equitemper_note_off / 12), type, detune })
}
class EndSFX {
    readonly CHORUS = [1, 2, 5, 10] // 4*2+1 = 9 voices
    readonly CHORD = [0, 7, 10, 12, 15, 19, 24, 36]
    readonly BASE_FREQ = 100
    readonly sub_osc = make_osc(this.BASE_FREQ, -12, 0, "sine")
    readonly sub_gain = new GainNode(actx(), { gain: 0.5 })
    // readonly sub_gain = new GainNode(actx(), { gain: 0.0 })
    readonly chord_oscbank = this.CHORD.flatMap(note => [0, ...this.CHORUS, ...this.CHORUS.map(v => -v)].map(detune => (
        make_osc(this.BASE_FREQ, note, detune, Math.random() < 0.4 ? "square" : "sawtooth")
    )))
    readonly chord_gain = new GainNode(actx(), { gain: 0.05 })
    // readonly chord_gain = new GainNode(actx(), { gain: 0.0 })
    readonly master_gain = new GainNode(actx(), { gain: 0.0 })

    readonly chip_osc = make_osc(this.BASE_FREQ, 0, 0, "sawtooth")

    readonly sparkle_osc = make_osc(this.BASE_FREQ, 24, 0, "sine")
    readonly sparkle_gain = new GainNode(actx(), { gain: 0.0 })
    readonly sparkle_reverb = new ConvolverNode(actx(), { buffer: genconvbuf_chonk(2.5) })

    readonly sparkle_reup_timeout: NodeJS.Timeout


    constructor() {
        const t = actx().currentTime

        this.chord_oscbank.forEach(osc => {
            osc.start(t + 0.4)
            osc.connect(this.chord_gain)
        })
        this.chord_gain.connect(this.master_gain)
        this.sub_osc.start(t + 0.4)
        this.sub_osc.connect(this.sub_gain)
        this.sub_gain.connect(this.master_gain)
        this.chip_osc.start(t)
        // this.chip_osc.connect(this.master_gain)
        this.sparkle_osc.start(t + 0.4)
        // this.sparkle_osc.connect(this.sparkle_gain).connect(this.master_gain)
        this.sparkle_osc.connect(this.sparkle_gain).connect(this.sparkle_reverb).connect(this.master_gain)
        this.master_gain.connect(actx().destination)


        this.master_gain.gain.setValueAtTime(0.0, t + 0.0)
        this.master_gain.gain.linearRampToValueAtTime(0.9, t + 0.01)
        for (let i = 1; i < 8; i++) {
            this.chip_osc.frequency.setValueAtTime(this.BASE_FREQ * (i + 1), t + i * 0.05)
        }
        this.chip_osc.stop(t + 0.41)
        this.master_gain.gain.linearRampToValueAtTime(0.4, t + 0.4)
        this.chord_oscbank.forEach(osc => {
            osc.detune.setValueAtTime(osc.detune.value, t + 0.4)
            osc.detune.linearRampToValueAtTime(0, t + 4.34)
        })
        let t1 = t + 0.4
        this.sparkle_reverb.normalize = false
        for (let t0 = t1; t0 < t1 + 2; t0 += 0.01 + 0.05 * Math.random()) {
            this.sparkle_osc.frequency.setValueAtTime(
                this.BASE_FREQ * 2 ** ((36 + [0, 3, 5, 7, 9][Math.floor(Math.random() * 5)]) / 12 + Math.floor(Math.random() * 4)),
                t0,
            )
            this.sparkle_gain.gain.setValueAtTime(0.0, t0)
            this.sparkle_gain.gain.linearRampToValueAtTime(0.9, t0 + 0.01)
            this.sparkle_gain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.038)
            this.sparkle_gain.gain.linearRampToValueAtTime(0.0, t0 + 0.039)
        }
        t1 += 2
        this.sparkle_reup_timeout = setInterval(() => {
            for (let t0 = t1; t0 < t1 + 1; t0 += 0.01 + 0.05 * Math.random()) {
                this.sparkle_osc.frequency.setValueAtTime(
                    this.BASE_FREQ * 2 ** ((36 + [0, 3, 5, 7, 9][Math.floor(Math.random() * 5)]) / 12 + Math.floor(Math.random() * 4)),
                    t0,
                )
                this.sparkle_gain.gain.setValueAtTime(0.0, t0)
                this.sparkle_gain.gain.linearRampToValueAtTime(0.9, t0 + 0.01)
                this.sparkle_gain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.038)
                this.sparkle_gain.gain.linearRampToValueAtTime(0.0, t0 + 0.039)
            }
            t1 += 1
        }, 1000)
        this.master_gain.gain.linearRampToValueAtTime(2.5, t + 0.41)
        this.master_gain.gain.linearRampToValueAtTime(0.9, t + 0.45)
        this.master_gain.gain.linearRampToValueAtTime(0.5, t + 2.5)
        this.master_gain.gain.exponentialRampToValueAtTime(0.005, t + 20)
        this.master_gain.gain.linearRampToValueAtTime(0.0, t + 22.5)
        setTimeout(() => {
            this.destroy()
        }, 23000);
    }

    destroy() {
        clearInterval(this.sparkle_reup_timeout)
        this.sub_osc.stop()
        this.sub_osc.disconnect()
        this.sub_gain.disconnect()
        this.chord_oscbank.forEach(osc => {
            osc.stop()
            osc.disconnect()
        })
        this.chord_gain.disconnect()
        this.master_gain.disconnect()
    }
}