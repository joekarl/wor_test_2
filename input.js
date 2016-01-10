function Input() {
  var i;
  this.pressed = new Array(255);
  window.addEventListener('keyup', function(event) { this.onKeyup(event); }.bind(this), false);
  window.addEventListener('keydown', function(event) { this.onKeydown(event); }.bind(this), false);
  for (i = 0; i < 255; ++i) {
    this.pressed[i] = -1;
  }
}

Input.prototype.isActive = function(code) {
  return this.pressed[code] > 0;
}

Input.prototype.onKeyup = function(e) {
  this.pressed[e.keyCode] = -1;
};

Input.prototype.clearKey = function(code) {
  this.pressed[code] = -1;
}

Input.prototype.onKeydown = function(e) {
  this.pressed[e.keyCode] = new Date().getTime();
};
