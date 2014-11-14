var re = /([a-zA-Z]*)([0-9]*)-?([0-9])*(\+?):(.*)/g;
var str = 'key2+:3+';
var found = re.exec(str);
console.log(found[2]);