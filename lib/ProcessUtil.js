/**
 * Author: Zeta Ret
 * Process Util package
 **/

var cfg, pushNotification;

function updateCFG(c) {
	cfg = c;
}

function setUtils(_pushNotification) {
	pushNotification = _pushNotification;
}

function hasProcess(path) {
	return cfg.execBuffer && cfg.execBuffer[path] ? true : false;
}

function listProcess() {
	var k, list = {};
	for (k in cfg.execBuffer) list[k] = cfg.execBuffer[k].length;
	return list;
}

function stdout(chunk, res, filepath) {
	console.log(res.pid, filepath);
	console.log(chunk);
}

function exeFileCommand() {
	var cp, res, editor = atom.workspace.getActiveTextEditor(),
		filepath = editor ? editor.getPath() : null;
	if (!filepath) return;

	if (!cfg.exec) {
		cp = require('child_process');
		cfg.exec = cp.exec;
		cfg.execFile = cp.execFile;
		cfg.fork = cp.fork;
		cfg.spawn = cp.spawn;
	}
	if (!cfg.execBuffer) cfg.execBuffer = {};
	if (!cfg.execBuffer[filepath]) cfg.execBuffer[filepath] = [];

	function Callback(err, stdout, stderr) {
		if (err) {
			if (cfg.console === 'yes' || cfg.exeOptions.processData === 'yes') console.log('exec error:', err);
		} else {
			if (cfg.console === 'yes') console.log(stdout);
		}
	}

	try {
		switch (cfg.exeOptions.processCreate) {
			case 'fork':
				res = cfg.fork(cfg.exeOptions.nodeExe, [filepath], {
					detached: true
				});
				break;
			case 'spawn':
				res = cfg.spawn(cfg.exeOptions.nodeExe, [filepath], {
					detached: true
				});
				break;
			case 'file':
				res = cfg.execFile(cfg.exeOptions.nodeExe, [filepath], {}, Callback);
				break;
			case 'exec':
			default:
				res = cfg.exec(cfg.exeOptions.nodeExe + ' ' + filepath, Callback);
		}
	} catch (terr) {}
	if (res) {
		cfg.execBuffer[filepath].push(res);
		if (cfg.exeOptions.processData === 'yes') {
			res.stdout.on('data', chunk => stdout(chunk, res, filepath));
			if (cfg.exeOptions.autoOpenConsole === 'yes') atom.openDevTools();
		}
		pushNotification('Process [' + res.pid + ']: ' + filepath, 'addSuccess', filepath + ':process');
		cfg.emitter.emit('updateProcessStatus');
		if (cfg.console === 'yes') console.log(filepath, res, res.pid);
	}
}

function exeKillCommand() {
	if (cfg.execBuffer) {
		for (var k in cfg.execBuffer) cfg.execBuffer[k].forEach(p => killProcess(p));
		delete cfg.execBuffer;
		pushNotification('Kill Process', 'addInfo', 'kill:process');
		cfg.emitter.emit('updateProcessStatus');
		if (cfg.console === 'yes') console.log('#Kill Process');
	}
}

function exeKillActiveCommand(path) {
	if (cfg.execBuffer && cfg.execBuffer[path]) {
		var pid = cfg.execBuffer[path].map(p => killProcess(p));
		delete cfg.execBuffer[path];
		cfg.emitter.emit('updateProcessStatus');
		pushNotification('Kill Process [' + pid.join(', ') + ']: ' + path, 'addInfo', 'kill:process:' + path);
	}
}

function killProcess(p) {
	const pid = p.pid;
	if (p.stdin) p.stdin.destroy();
	if (p.stdout) p.stdout.destroy();
	if (p.stderr) p.stderr.destroy();
	p.kill(cfg.exeOptions.killSignal);
	return pid;
}

module.exports.updateCFG = updateCFG;
module.exports.setUtils = setUtils;
module.exports.hasProcess = hasProcess;
module.exports.listProcess = listProcess;
module.exports.exeFileCommand = exeFileCommand;
module.exports.exeKillCommand = exeKillCommand;
module.exports.exeKillActiveCommand = exeKillActiveCommand;
module.exports.killProcess = killProcess;