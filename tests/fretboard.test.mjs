import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NOTES, STRINGS, beatFrame, createNotePicker, formatTime } from '../src/lib/fretboard.ts';

test('each deck covers all 12 notes, without repeats at deck boundaries', () => {
  for (const random of [Math.random, () => 0, () => 0.999]) {
    const draw = createNotePicker(random);
    let previous;
    for (let deck = 0; deck < 100; deck++) {
      const notes = Array.from({ length: 12 }, draw);
      assert.equal(new Set(notes).size, NOTES.length);
      assert.notEqual(notes[0], previous);
      previous = notes.at(-1);
    }
  }
});
test('four preparation beats followed by exactly six string beats per note', () => {
  for (let i = 0; i < 4; i++) assert.deepEqual(beatFrame(i), { preparing: true, beat: i, round: 0 });
  for (let round = 0; round < 24; round++) {
    for (let string = 0; string < STRINGS.length; string++) {
      assert.deepEqual(beatFrame(4 + round * 6 + string), { preparing: false, beat: string, round });
    }
  }
});
test('timer rounds up and clamps at zero', () => {
  assert.equal(formatTime(300), '5:00');
  assert.equal(formatTime(59.2), '1:00');
  assert.equal(formatTime(-0.1), '0:00');
});
