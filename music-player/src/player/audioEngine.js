import { Howl, Howler } from 'howler';

// Wraps Howler into a small engine that exposes events for the React layer.
// Uses a custom 'media-loader://' protocol exposed by Electron so that absolute
// Windows/macOS/Linux file paths can be played without violating CSP.

function pathToMediaUrl(filePath) {
  // media-loader://x/<absolute-file-path>
  const normalized = filePath.replace(/\\/g, '/');
  return `media-loader://x/${encodeURI(normalized)}`;
}

function extToFormat(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  return [ext];
}

export class AudioEngine extends EventTarget {
  constructor() {
    super();
    this.current = null;
    this.preload = null;
    this.currentTrack = null;
    this.volume = 0.8;
    this._tickHandle = null;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    Howler.volume(this.volume);
    this.dispatchEvent(new CustomEvent('volume', { detail: { volume: this.volume } }));
  }

  getVolume() { return this.volume; }

  isPlaying() { return !!(this.current && this.current.playing()); }

  getSeek() { return this.current ? Number(this.current.seek()) || 0 : 0; }

  getDuration() { return this.current ? this.current.duration() : 0; }

  seek(seconds) {
    if (!this.current) return;
    this.current.seek(seconds);
    this.dispatchEvent(new CustomEvent('seek', { detail: { seek: seconds } }));
  }

  pause() {
    if (this.current && this.current.playing()) {
      this.current.pause();
      this._stopTick();
      this.dispatchEvent(new CustomEvent('pause'));
    }
  }

  resume() {
    if (this.current && !this.current.playing()) {
      this.current.play();
      this._startTick();
      this.dispatchEvent(new CustomEvent('play', { detail: { track: this.currentTrack } }));
    }
  }

  stop() {
    if (this.current) {
      this.current.stop();
      this.current.unload();
      this.current = null;
      this.currentTrack = null;
      this._stopTick();
      this.dispatchEvent(new CustomEvent('stop'));
    }
  }

  play(track, { onEnd } = {}) {
    if (!track) return;
    // Tear down previous
    if (this.current) {
      try { this.current.unload(); } catch {}
      this.current = null;
    }

    const howl = new Howl({
      src: [pathToMediaUrl(track.path)],
      format: extToFormat(track.path),
      html5: true, // streaming + media-key friendly + supports large files
      volume: this.volume,
      onplay: () => {
        this.dispatchEvent(new CustomEvent('play', { detail: { track } }));
        this._startTick();
      },
      onpause: () => {
        this.dispatchEvent(new CustomEvent('pause'));
        this._stopTick();
      },
      onend: () => {
        this._stopTick();
        this.dispatchEvent(new CustomEvent('ended', { detail: { track } }));
        if (onEnd) onEnd();
      },
      onload: () => {
        this.dispatchEvent(new CustomEvent('loaded', {
          detail: { track, duration: howl.duration() },
        }));
      },
      onloaderror: (_id, err) => {
        console.error('Howler load error', track.path, err);
        this.dispatchEvent(new CustomEvent('error', { detail: { track, err } }));
        // Treat error as ended so the queue advances
        if (onEnd) onEnd();
      },
      onplayerror: (_id, err) => {
        console.error('Howler play error', track.path, err);
        // Howler quirk: must re-call play on play error after unlock
        howl.once('unlock', () => howl.play());
      },
    });

    this.current = howl;
    this.currentTrack = track;
    howl.play();
  }

  _startTick() {
    this._stopTick();
    this._tickHandle = setInterval(() => {
      this.dispatchEvent(new CustomEvent('tick', {
        detail: { seek: this.getSeek(), duration: this.getDuration() },
      }));
    }, 250);
  }

  _stopTick() {
    if (this._tickHandle) {
      clearInterval(this._tickHandle);
      this._tickHandle = null;
    }
  }
}

export const audio = new AudioEngine();
