import '../../libs/WebAudioFontPlayer'
import { Settings } from '../Settings';

// Serialization Enums
const SONG_TITLE = 0;
const SONG_DURATION = 1;
const SONG_TRACKS = 2;
const SONG_TRACK_NOTES = 3;
const SONG_BEATS = 4;
const SONG_BEAT_NOTES = 5;

const TRACK_INSTRUMENT = 0;
const TRACK_VOLUME = 1;
const TRACK_PROGRAM = 2;
const TRACK_N = 3;

const TRACK_NOTE_INDEX = 0;
const TRACK_NOTE_WHEN = 1;
const TRACK_NOTE_DURATION = 2;
const TRACK_NOTE_PITCH = 3;
const TRACK_NOTE_SLIDES = 4;

const BEAT_INSTRUMENT = 0;
const BEAT_VOLUME = 1;
const BEAT_N = 2;

const BEAT_NOTE_INDEX = 0;
const BEAT_NOTE_WHEN = 1;

class MidiPlayerClass {

	constructor(){
		this.audioContext = null;
		this.player = null;
		this.reverberator = null;
		this.songStart = 0;
		this.input = null;
		this.currentSongTime = 0;
		this.nextStepTime = 0;
		this.nextPositionTime = 0;
		this.setSpeed(1.0);
		this.notes = [];
		this.playing = true;
		this.ready = false;
		this.shouldPlay = false;
		this.song = null;
		this.elapsed = 0;
		this.instruments = [];
		this.midiKeys = ["c4","c_4","d4","d_4","e4","f4","f_4","g4","g_4","a4","a_4","b4","c5","c_5","d5","d_5","e5","f5","f_5","g5","g_5","a5","a_5","b5","c6"];
		this.midiNotes = [4*12+0,4*12+1,4*12+2,4*12+3,4*12+4,4*12+5,4*12+6,4*12+7,4*12+8,4*12+9,4*12+10,4*12+11,5*12+0,5*12+1,5*12+2,5*12+3,5*12+4,5*12+5,5*12+6,5*12+7,5*12+8,5*12+9,5*12+10,5*12+11,6*12+0];
		this.keyNoteMap = (()=>{
			const obj = {};
			this.midiKeys.forEach((key, i) =>{
				obj[key] = this.midiNotes[i];
			})
			return obj;
		})();
		this.keyLengths = ['1','2','4','1/2','1/4','1/8','1/16','1/32','1/64','1 1/2','3','6','3/4', '3/8'];
		this.keyLengthTime = [1,2,4,1/2,1/4,1/8,1/16,1/32,1/64,1.5,3,6,3/4,3/8];
		this.keyLengthMap = (()=>{
			const obj = {};
			this.keyLengths.forEach((key, i) =>{
				obj[key] = this.keyLengthTime[i];
			})
			return obj;
		})();

		console.log(this);
	}

	setSpeed(speed){
		this.stepDuration = (44 / 1000) * speed;
		this.pitchMultiplier = speed;
		this.speed = speed;
	}

	play() {
		if(this.ready){
			if(this.elapsed){
				this.resume();
			}else{
				this.stop();
				this.playing = true;
				this.shouldPlay = false;
				this.tick();
			}
		}else{
			this.shouldPlay = true;
		}
	}

	pause(){
		this.elapsed = this.audioContext.currentTime-this.songStart;
		this.playing = false;
	}
	resume(){
		if(!this.playing) this.tick();

		this.songStart = this.audioContext.currentTime-this.elapsed;
		this.currentSongTime = this.elapsed;
		this.nextStepTime = this.audioContext.currentTime;
		this.playing = true;
	}
	reset(){
		this.elapsed = 0;
	}

	stop(){
		this.playing = false;
		if(this.ready){
			this.currentSongTime = 0;
			this.songStart = this.audioContext.currentTime;
			this.nextStepTime = this.audioContext.currentTime;
		}
	}

	tick() {
		if(this.playing){
			const duration = this.song[SONG_DURATION];

			if (this.audioContext.currentTime > this.nextStepTime - this.stepDuration) {
				this.sendNotes(this.song, this.songStart, this.currentSongTime, this.currentSongTime + this.stepDuration, this.audioContext, this.input, this.player);
				this.currentSongTime = this.currentSongTime + this.stepDuration;
				this.nextStepTime = this.nextStepTime + this.stepDuration;
				if (this.currentSongTime > duration) {
					this.currentSongTime = this.currentSongTime - duration;
					this.sendNotes(this.song, this.songStart, 0, this.currentSongTime, this.audioContext, this.input, this.player);
					this.songStart = this.songStart + duration;
				}
			}
			if (this.nextPositionTime < this.audioContext.currentTime) {
				this.nextPositionTime = this.audioContext.currentTime + 3;
			}
		}
		window.requestAnimationFrame(t => {
			this.tick();
		});
	}

	sendNotes(song, songStart, start, end, audioContext, input, player){
		const startSecondIndex = Math.floor(start);
		const endSecondIndex = Math.ceil(end);

		const seconds = endSecondIndex-startSecondIndex;

		const tracks = song[SONG_TRACKS];
		const trackNotes = song[SONG_TRACK_NOTES];
		const beats = song[SONG_BEATS];
		const beatNotes = song[SONG_BEAT_NOTES];

		const volumeOffset = 0.2 * Settings.midiMusicVolume;

		for(let i = 0; i<=seconds; i++){
			const secondIndex = startSecondIndex+i;

			// tracks
			let notes = trackNotes[secondIndex] || [];

			notes.forEach(note=> {
				const track = tracks[note[TRACK_NOTE_INDEX]];
				const instrument = window[track[TRACK_INSTRUMENT]];
				const when = note[TRACK_NOTE_WHEN];
				const pitch = note[TRACK_NOTE_PITCH];
				let duration = Math.min(note[TRACK_NOTE_DURATION], 3);
				const volume = track[TRACK_VOLUME] / 7 * volumeOffset;
				const slides = note[TRACK_NOTE_SLIDES];
				if (when >= start && when < end) {
					player.queueWaveTable(audioContext, input, instrument, songStart + when, pitch*this.pitchMultiplier, duration*this.speed, volume, slides);
				}
			});

			// beats
			notes = beatNotes[secondIndex] || [];

			notes.forEach(note => {
				const beat = beats[note[BEAT_NOTE_INDEX]];
				const instrument = window[beat[BEAT_INSTRUMENT]];
				const when =  note[BEAT_NOTE_WHEN];
				const n = beat[BEAT_N];
				const duration = 1.5;
				const volume = beat[BEAT_VOLUME] / 2 * volumeOffset;
				if (when >= start && when < end) {
					player.queueWaveTable(audioContext, input, instrument, songStart + when, n, duration, volume);
				}
			});
		}
	}

	serializeMIDI(arrayBuffer, title){
		const midiFile = new MIDIFile(arrayBuffer);
		const song = midiFile.parseSong();


		let lowestWhen = Number.POSITIVE_INFINITY;


		const tracks = [];
		for (let t = 0; t < song.tracks.length; t++) {
			let trackRef = song.tracks[t];
			const track = [];
			track[TRACK_VOLUME] = trackRef.volume;
			track[TRACK_PROGRAM] = trackRef.program;
			track[TRACK_N] = trackRef.n;
			const noteRef = trackRef.notes[0];
			if(noteRef && noteRef.when<lowestWhen) lowestWhen = noteRef.when;
			tracks.push(track);
		}

		const beats = [];
		for (let b = 0; b < song.beats.length; b++) {
			let beatRef = song.beats[b];
			const beat = [];
			beat[BEAT_VOLUME] = beatRef.volume;
			beat[BEAT_N] = beatRef.n;
			const noteRef = beatRef.notes[0];
			if(noteRef && noteRef.when<lowestWhen) lowestWhen = noteRef.when;
			beats.push(beat);
		}


		// indexed in seconds [0] = first second, [1] = second second
		const trackNotes = [];
		for (let t = 0; t < song.tracks.length; t++) {
			let track = song.tracks[t];
			for (let i = 0; i < track.notes.length; i++) {
				const noteRef = track.notes[i];

				const note = [];
				note[TRACK_NOTE_INDEX] = t;
				note[TRACK_NOTE_WHEN] = noteRef.when-lowestWhen;
				note[TRACK_NOTE_DURATION] = noteRef.duration;
				note[TRACK_NOTE_PITCH] = noteRef.pitch;
				note[TRACK_NOTE_SLIDES] = noteRef.slides;

				const secondIndex = Math.floor(note[TRACK_NOTE_WHEN]);

				if(trackNotes[secondIndex] === undefined) trackNotes[secondIndex] = [];

				trackNotes[secondIndex].push(note);
			}
		}

		const beatNotes = [];
		for (let b = 0; b < song.beats.length; b++) {
			let beat = song.beats[b];
			for (let i = 0; i < beat.notes.length; i++) {
				const beatRef = beat.notes[i];

				const note = [];
				note[BEAT_NOTE_INDEX] = b;
				note[BEAT_NOTE_WHEN] = beatRef.when-lowestWhen;

				const secondIndex = Math.floor(note[BEAT_NOTE_WHEN]);
				if(beatNotes[secondIndex] === undefined) beatNotes[secondIndex] = [];

				beatNotes[secondIndex].push(note);
			}
		}

		const maxTrim = 100;
		while((trackNotes[0] === undefined || beatNotes[0] === undefined) && maxTrim<100){
			trackNotes.shift();
			beatNotes.shift();
		}

		const serializedSong = [];
		serializedSong[SONG_TITLE] = title;
		serializedSong[SONG_DURATION] = song.duration;
		serializedSong[SONG_TRACKS] = tracks;
		serializedSong[SONG_TRACK_NOTES] = trackNotes;
		serializedSong[SONG_BEATS] = beats;
		serializedSong[SONG_BEAT_NOTES] = beatNotes;

		return serializedSong;
	}

	clean(){
		if(this.audioContext) this.audioContext.close();
		this.audioContext = null;
	}

	startLoad(song) {

		if(this.song === song) return;
		this.clean();

		let AudioContextFunc = window.AudioContext || window.webkitAudioContext;
		this.audioContext = new AudioContextFunc();
		this.player = new WebAudioFontPlayer();
		this.reverberator = this.player.createReverberator(this.audioContext);
		this.reverberator.output.connect(this.audioContext.destination);
		this.input = this.reverberator.input;

		const tracks = song[SONG_TRACKS];

		tracks.forEach(track => {
			const program = track[TRACK_PROGRAM];
			let nn = this.player.loader.findInstrument(program);
			let info = this.player.loader.instrumentInfo(nn);
			track[TRACK_INSTRUMENT] = info.variable;
			this.instruments.push(info.variable);
			this.player.loader.startLoad(this.audioContext, info.url, info.variable);
		});

		const beats = song[SONG_BEATS];
		beats.forEach(beat => {
			let nn = this.player.loader.findDrum(beat[BEAT_N]);
			let info = this.player.loader.drumInfo(nn);
			beat[BEAT_INSTRUMENT] = info.variable;
			this.instruments.push(info.variable);
			this.player.loader.startLoad(this.audioContext, info.url, info.variable);
		});

		this.player.loader.waitLoad(() => {
			this.ready = true;
			if(this.shouldPlay){
				this.play();
			}
		});

		this.song = song;
	}
}

export const MidiPlayer = new MidiPlayerClass();
