import { soundSourceMap, SoundType } from "@/renderer/assets/sound";
import { ImmutableRecord } from "tsshogi";
import { KihuyomiSounds } from "@/renderer/sound/sound";

export class SoundManager {
  private synth: SpeechSynthesis;
  private audioContext: AudioContext;
  private audioBuffers: Map<string, AudioBuffer>; // 音源名をキーにAudioBufferを保存

  constructor() {
    this.synth = window.speechSynthesis;
    // 互換性のため AudioContext と webkitAudioContext を併用
    const win = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    this.audioContext = new (win.AudioContext || win.webkitAudioContext!)();
    this.audioBuffers = new Map();
    Object.values(SoundType).forEach((st) => {
      this.preloadSounds(st);
    });
  }

  async preloadSounds(name: SoundType): Promise<void> {
    const path = soundSourceMap[name as keyof typeof soundSourceMap];
    const response = await fetch(path);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.audioBuffers.set(name, audioBuffer);
  }

  async playSequence(names: SoundType[]): Promise<void> {
    let nextScheduleTime = this.audioContext.currentTime;
    names.forEach((name) => {
      const audioBuffer = this.audioBuffers.get(name);
      if (!audioBuffer) {
        return;
      }
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(nextScheduleTime);
      nextScheduleTime = nextScheduleTime + audioBuffer.duration;
    });
  }

  read(record: ImmutableRecord): void {
    const kihuyomi = new KihuyomiSounds(record);
    const voices = kihuyomi.getVoices();
    this.playSequence(voices);
  }
}
