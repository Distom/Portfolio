'use strict';

let rotatePropertyInterval;

function runRotateProperty() {
  let deg = 0;
  let step = 2;
  rotatePropertyInterval = setInterval(() => {
    requestAnimationFrame(() => {
      if (deg < -360 || deg > 360) {
        step *= -1;
      }
      document.documentElement.style.setProperty(
        '--rotate',
        `${(deg += step)}deg`
      );
    });
  }, 20);
}

runRotateProperty();
