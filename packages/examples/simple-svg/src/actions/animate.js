function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16)
}

export function animate(time, duration) {
  let goal = time + duration
  let color = randomColor()

  return function loop(action) {
    time += 16

    if (time > goal) {
      action.complete({ color, time })
    } else {
      action.next({ color, time })
      requestAnimationFrame(() => loop(action))
    }
  }
}
