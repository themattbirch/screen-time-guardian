// src/utils/sounds.ts

interface Sound {
  id: string;
  name: string;
  url: string;
  category: "meditation" | "ambient" | "bell";
}

const defaultSounds: Sound[] = [
  {
    id: "gentle-bell",
    name: "Gentle Bell",
    url: "/sounds/gentle-bell.mp3",
    category: "bell",
  },
  {
    id: "meditation-bowl",
    name: "Meditation Bowl",
    url: "/sounds/meditation-bowl.mp3",
    category: "meditation",
  },
  {
    id: "forest-ambient",
    name: "Forest Ambience",
    url: "/sounds/forest-ambient.mp3",
    category: "ambient",
  },
];

class SoundManager {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private soundBuffers: Map<string, AudioBuffer> = new Map();


  public isContextRunning(): boolean {
    // If audioContext is null, it obviously isn't running
    if (!this.audioContext) return false;
    return this.audioContext.state === "running";
  }

  private async createAudioContextIfNeeded(): Promise<void> {
    // Only create it once the user actually interacts
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
  }


  public async ensureAudioContext(): Promise<void> {
    // Only resume if we have an AudioContext already
    if (this.audioContext && this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /**
   * Fetches and decodes the sound. If you get warnings about
   * AudioContext not allowed to start, see if you're calling this
   * before any user gesture.
   */
  async loadSound(sound: Sound): Promise<void> {
    if (this.soundBuffers.has(sound.id)) return;

    // Optionally, you could create the context up front:
    // await this.createAudioContextIfNeeded();
    // Decoding in a suspended context is typically allowed.

    try {
      const response = await fetch(sound.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // Use non-null assertion because we do want to assume
      // the AudioContext is set by now:
      if (!this.audioContext) {
        // If not set, create it so decodeAudioData won't fail
        await this.createAudioContextIfNeeded();
      }
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.soundBuffers.set(sound.id, audioBuffer);
    } catch (error) {
      console.error(`Error loading sound ${sound.name}:`, error);
      throw error; // Propagate error for handling by caller
    }
  }

  setVolume(volume: number) {
    if (volume < 0 || volume > 100) {
      console.warn("Volume should be between 0 and 100");
      volume = Math.max(0, Math.min(100, volume));
    }

    try {
      // Safely check gainNode
      if (this.gainNode) {
        this.gainNode.gain.value = volume / 100;
      }
    } catch (error) {
      console.error("Error setting volume:", error);
    }
  }

  async playSound(soundId: string): Promise<void> {
    // Create/resume context if they call playSound manually
    await this.createAudioContextIfNeeded();
    await this.ensureAudioContext();

    const buffer = this.soundBuffers.get(soundId);
    if (!buffer) {
      throw new Error(`Sound with ID "${soundId}" is not loaded.`);
    }

    // Non-null assertion because we've ensured it is set above
    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode!);
    source.start(0);

    return new Promise((resolve) => {
      source.onended = () => resolve();
    });
  }

  isSoundLoaded(soundId: string): boolean {
    return this.soundBuffers.has(soundId);
  }

  dispose() {
    try {
      // Safe optional chaining
      this.audioContext?.close();
      this.soundBuffers.clear();
    } catch (error) {
      console.error("Error disposing SoundManager:", error);
    }
  }
}

export const soundManager = new SoundManager();
export const availableSounds = defaultSounds;
