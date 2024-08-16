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
            const left = Math.max(0, Math.round((until.getTime() - Date.now()) / 1000))
            set_time_left(left)
            sfx?.tick((left - 1) % 60 === 0)

            sref.current?.getAnimations().find(v => (v.id || (v as any).animationName) === styles.pulse)?.play()
            if (left % 60 === 0) mref.current?.getAnimations().find(v => (v.id || (v as any).animationName) === styles.pulse_long)?.play()
            if (left % (60 * 60) === 0) href.current?.getAnimations().find(v => (v.id || (v as any).animationName) === styles.pulse_long)?.play()
            if (left % (60 * 60 * 24) === 0) dref.current?.getAnimations().find(v => (v.id || (v as any).animationName) === styles.pulse_long)?.play()
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
                    {time_left > 0 ? <>
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

function genconvbuf(): AudioBuffer {
    const actx = _actx_!
    const aubuf = new AudioBuffer({ length: actx.sampleRate * 1.0, sampleRate: actx.sampleRate, numberOfChannels: 2 })
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
    tick(special: boolean) {
        if (actx().state == "suspended") actx().resume()
        const time = actx().currentTime + 0.95
        if (special) {
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
        } else {
            // this.osc.frequency.setValueAtTime(10.0, time + 0.0)
            // this.osc1.frequency.setValueAtTime(10.0, time + 0.0)
            // this.gain.gain.setValueAtTime(0.0, time + 0.0)
            // this.gain.gain.setValueAtTime(1.0, time + 0.01)
            // this.gain.gain.setValueAtTime(0.0, time + 0.02)
            this.osc.frequency.setValueAtTime(400.0, time + 0.0)
            this.osc.frequency.setValueAtTime(600.0, time + 0.1)
            this.osc1.frequency.setValueAtTime(201.0, time + 0.0)
            this.osc1.frequency.setValueAtTime(151.0, time + 0.1)
            this.gain.gain.setValueAtTime(0.0, time + 0.0)
            this.gain.gain.linearRampToValueAtTime(0.6, time + 0.01)
            this.gain.gain.linearRampToValueAtTime(0.6, time + 0.05)
            this.gain.gain.exponentialRampToValueAtTime(1e-6, time + 0.8)
            this.gain.gain.linearRampToValueAtTime(0.0, time + 0.9)
        }
    }

    destroy() {
        this.osc.disconnect()
        this.osc.stop()
        this.gain.disconnect()
    }
}
