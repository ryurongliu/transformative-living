window.addEventListener('keyup', keyUp, false);

function keyUp(event) {
  const key = (event.detail || event.which).toString();
  alert(key);
}
