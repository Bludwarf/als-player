var midi = require('midi-node');
var stream = <something writable>;
var writer = new midi.Writer(stream);
 
writer.startFile(0, 1, 128);
writer.startTrack();
writer.noteOn(0, 0, 0x3c, 100); // Channel 0, middle C4, 100 velocity 