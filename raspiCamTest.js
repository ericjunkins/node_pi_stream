var spawn = require('child_process').spawn;
var fs = require('fs');
var Datauri = require('datauri');
var server = require('http').createServer();
var io = require('socket.io')(server);
var readline = require('readline');

var pidFile = '/tmp/raspifastcamd.pid';
var datauri = new Datauri();
var pid;
var start;
var picTaker;
const folder = './tempimages';



spawn('/home/pi/Desktop/node_programs/raspifastcam/start_cam_high.sh');

var pidChecker = setTimeout( function() {
	if (!fs.existsSync(pidFile)) {
		return;
	} else {
		var lineReader = readline.createInterface({
			input: fs.createReadStream(pidFile)
		});
		lineReader.on('line',function(line){
			pid = parseInt(line);
			picTaker = setInterval(function() {
				console.log(pid);
				process.kill(pid,'SIGUSR1');
			},100);
		});
	}
},2500);

io.on('connection', function(socket) {
	console.log('new connection');
});

datauri.on('encoded', function(content) {
	io.emit('newFrame', content);

});

var interval = setInterval(function() {
	fs.readdir(folder, (err, files) => {
		var filename = files[Math.max(files.length-2,0)];
		if (filename !== undefined){
			datauri.encode(folder + "/" +  filename);
		} else {
			console.log("no images");
		}
		if (files.length > 10) {
			for (var i = 0; i < files.length-10; i++) {
				spawn('rm', [folder + '/' + files[i]]);
			}
		}	
	});
},100);



process.on('SIGINT', function() {
	console.log("Exiting camera process");
	clearInterval(picTaker);
	spawn('/home/pi/Desktop/node_programs/raspifastcam/stop_camd.sh');
	setTimeout( function() {
		process.exit();
	},100);
});



server.listen(3000, '0.0.0.0', function() {
	console.log('listenting on 3000');
});

