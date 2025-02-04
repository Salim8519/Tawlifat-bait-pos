// Create a single AudioContext instance
let audioContext: AudioContext | null = null;

export function playBeep() {
  try {
    // Initialize AudioContext on first use (must be triggered by user interaction)
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    // Create an oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Configure the beep sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // frequency in hertz
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // volume

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Play a short beep
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1); // Duration: 100ms

  } catch (error) {
    console.error('Error playing beep sound:', error);
  }
}
