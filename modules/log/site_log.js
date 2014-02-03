console.log('hello');

var socket = io.connect('http://localhost');
socket.on('news', function (data) {
  $('#log').html(JSON.stringify(data));
  socket.emit('my other event', { my: 'data' });
});