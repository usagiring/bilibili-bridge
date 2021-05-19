const internalIp = require('internal-ip');

(async () => {
  console.log(await internalIp.v6());
  //=> 'fe80::1'

  console.log(await internalIp.v4());
  //=> '10.0.0.79'
})();

console.log(internalIp.v6.sync())
//=> 'fe80::1'

console.log(internalIp.v4.sync())
//=> '10.0.0.79'


var os = require('os');

var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}

console.log(addresses);