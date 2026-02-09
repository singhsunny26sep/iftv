

let SoundModule;
try {
	SoundModule = require('react-native-sound');
} catch (e) {
	SoundModule = null;
}

class AudioPlayerSingleton {
	constructor() {
		this.sound = null;
		this.currentUrl = '';
		this.isCurrentlyPlaying = false;
		if (SoundModule && typeof SoundModule.setCategory === 'function') {
			try {
				// iOS only; safe no-op on Android when not supported
				SoundModule.setCategory('Playback', true);
				if (typeof SoundModule.enableInSilenceMode === 'function') {
					SoundModule.enableInSilenceMode(true);
				}
			} catch (_) {}
		}
	}

	loadAndPlay(url, onEnd) {
		console.log('AudioPlayer: Starting loadAndPlay for URL:', url);
		if (!url) {
			const err = new Error('No audio URL provided');
			console.warn(err.message);
			return Promise.reject(err);
		}
		if (!SoundModule) {
			const err = new Error('react-native-sound not installed. Install to enable playback');
			console.warn(err.message);
			return Promise.reject(err);
		}
		return new Promise((resolve, reject) => {
			try {
				console.log('AudioPlayer: Creating new Sound instance');
				this.stop();
				this.currentUrl = url;
				// For network URLs, pass null for basePath
				this.sound = new SoundModule(url, null, error => {
					console.log('AudioPlayer: Sound constructor callback called');
					if (error) {
						console.error('AudioPlayer: Failed to load sound', { url, error });
						reject(error);
						return;
					}
					console.log('AudioPlayer: Sound loaded successfully, setting volume and starting play');
					try {
						this.sound.setVolume(1.0);
						console.log('AudioPlayer: Volume set to 1.0');
						this.sound.play((success) => {
							console.log('AudioPlayer: Play callback - success:', success);
							this.isCurrentlyPlaying = false;
							if (!success) {
								console.warn('AudioPlayer: Playback failed', { url });
							}
							if (typeof onEnd === 'function') onEnd(success);
						});
						this.isCurrentlyPlaying = true;
						console.log('AudioPlayer: Play method called, should be playing');
					} catch (e) {
						console.error('AudioPlayer: Error starting playback', e);
						reject(e);
						return;
					}
					resolve();
				});
			} catch (e) {
				console.error('AudioPlayer: Exception in loadAndPlay try block', e);
				reject(e);
			}
		});
	}

	pause() {
		if (this.sound && this.isCurrentlyPlaying) {
			try { this.sound.pause(); } catch (e) { console.warn('Pause error', e); }
			this.isCurrentlyPlaying = false;
		}
	}

	resume() {
		if (this.sound && !this.isCurrentlyPlaying) {
			try {
				this.sound.play(() => {
					this.isCurrentlyPlaying = false;
				});
				this.isCurrentlyPlaying = true;
			} catch (e) { console.warn('Resume error', e); }
		}
	}

	stop() {
		if (this.sound) {
			try { this.sound.stop(); } catch (_) {}
			try { this.sound.release(); } catch (_) {}
			this.sound = null;
			this.currentUrl = '';
			this.isCurrentlyPlaying = false;
		}
	}

	isPlayingUrl(url) {
		return !!(this.sound && this.currentUrl === url && this.isCurrentlyPlaying);
	}
}

export const AudioPlayer = new AudioPlayerSingleton();


