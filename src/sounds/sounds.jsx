import { Howl } from 'howler';

export const sounds = {
  click: new Howl({
    src: ['https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3'],
    volume: 0.5
  }),
  beep: new Howl({
    src: ['https://assets.mixkit.co/sfx/preview/mixkit-beep-space-alert-3024.mp3'],
    volume: 0.3
  }),
  switch: new Howl({
    src: ['https://assets.mixkit.co/sfx/preview/mixkit-light-switch-click-1161.mp3'],
    volume: 0.4
  }),
  success: new Howl({
    src: ['https://assets.mixkit.co/sfx/preview/mixkit-success-bell-593.mp3'],
    volume: 0.5
  }),
  error: new Howl({
    src: ['https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3'],
    volume: 0.4
  })
};