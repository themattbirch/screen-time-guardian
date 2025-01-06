// src/utils/sounds.ts

interface Sound {
  id: string;
  name: string;
  url: string;
  category: 'meditation' | 'ambient' | 'bell';
}

const defaultSounds: Sound[] = [
  {
    id: 'gentle-bell',
    name: 'Gentle Bell',
    url: '/sounds/gentle-bell.mp3', // Ensure correct path
    category: 'bell'
  },
  {
    id: 'meditation-bowl',
    name: 'Meditation Bowl',
    url: '/sounds/meditation-bowl.mp3',
    category: 'meditation'
  },
  {
    id: 'forest-ambient',
    name: 'Forest Ambience',
    url: '/sounds/forest-ambient.mp3',
    category: 'ambient'
  }
];

class SoundManager {
  public audioContext: AudioContext; // Make it public
  private gainNode: GainNode;
  private soundBuffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    // Handle user interaction to resume AudioContext if suspended
    document.addEventListener('click', () => {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch((error) => {
          console.error('AudioContext resume failed:', error);
        });
      }
    }, { once: true });
  }

  async loadSound(sound: Sound): Promise<void> {
    if (this.soundBuffers.has(sound.id)) return;

    try {
      const response = await fetch(sound.url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundBuffers.set(sound.id, audioBuffer);
    } catch (error) {
      console.error(`Error loading sound ${sound.name}:`, error);
    }
  }

  setVolume(volume: number) {
    this.gainNode.gain.value = volume / 100;
  }

  async playSound(soundId: string) {
    const buffer = this.soundBuffers.get(soundId);
    if (!buffer) {
      console.warn(`Sound with ID "${soundId}" is not loaded.`);
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.start();
  }
}

export const soundManager = new SoundManager();
export const availableSounds = defaultSounds;
