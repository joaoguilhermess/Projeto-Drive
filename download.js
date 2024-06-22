import Util from "./util.js";
import Drive from "./drive.js";
import Log from "./log.js";

class Download {
	static Init() {
		this.initTime = Date.now();

		this.currentFiles = [];

		this.maxCurrent = 50;

		this.unlock = null;

		this.startLog();

		this.startDownload();
	}

	static startLog() {
		var context = this;

		Log.start(function() {
			return true;
		}, [
			function logAccount() {
				if (!Drive.info) return;

				Log.colorGray();
				Log.write("Account:");
				Log.colorReset();
				Log.write(Drive.info.user.displayName);
			}, function logSpent() {
				Log.colorGray();
				Log.write("Spent:");
				Log.colorReset();
				Log.write(Util.formatTime(Date.now() - context.initTime));
			}, function logFiles() {
				if (!context.files) return;
				if (context.files.length == 0) return;
				Log.colorGray();

				Log.write("Files:");
				Log.colorYelow();
				Log.write(context.files.length + context.currentFiles.length);
			}, function logCurrent() {
				if (context.currentFiles.length == 0) return;

				Log.colorGray();
				Log.write("Current:");
				Log.colorYelow();
				Log.write(context.currentFiles.length);
			}, function logSpeed() {
				if (context.currentFiles.length == 0) return;

				var speed = 0;

				for (let i = 0; i < context.currentFiles.length; i++) {
					if (context.currentFiles[i].startTime) {
						speed += context.currentFiles[i].sizeDownloaded / (Date.now() - context.currentFiles[i].startTime) * 1000;
					}
				}

				// var speed = context.totalSizeDownloaded / (Date.now() - context.startTime) * 1000;

				Log.colorGray();
				Log.write("Speed:");
				Log.colorReset();
				Log.write(Util.formatSize(speed) + "/s");
			}, function logTotalSize() {
				if (context.currentFiles.length == 0) return;

				Log.colorGray();
				Log.write("Size:");
				Log.colorReset();
				Log.write(Util.formatSize(context.totalSizeDownloaded) + "/" + Util.formatSize(context.totalSize));
			}, function logPercent() {
				if (context.currentFiles.length == 0) return;

				Log.colorYelow();
				Log.write((context.totalSizeDownloaded / context.totalSize * 100).toFixed(2) + "%");
			}, function logLeft() {
				if (context.currentFiles.length == 0) return;

				var time = Date.now() - context.startTime;

				time /= context.totalSizeDownloaded;

				if (context.totalSize > Drive.limitSize - Drive.usedSize) {
					time *= Drive.limitSize - Drive.usedSize;
				} else {
					time *= context.totalSize;
				}

				Log.colorGray();
				Log.write("Left:");
				Log.colorReset();
				Log.write(Util.formatTime(time));
			}
		]);
	}

	static async getFiles() {
		this.files = []

		var context = this;

		await Drive.iterateDriveFiles(async function(files) {
			for (let i = 0; i < files.length; i++) {
				context.files.push({id: files[i].id, name: files[i].name, size: parseInt(files[i].size)});
			}
		});

		this.files.sort(function(a, b) {
			return a.size - b.size;
		});
	}

	static getSize() {
		this.totalSize = 0;
		this.totalSizeDownloaded = 0;

		for (let i = 0; i < this.files.length; i++) {
			this.totalSize += this.files[i].size;
		}
	}

	static async startDownload() {
		Drive.getAccounts();

		await Drive.getTotalDriveSize();

		var context = this;

		for (let a = 0; a < Drive.accounts.length; a++) {
			await Drive.authDrive(Drive.accounts[a]);

			await Drive.getDriveInfo();

			Drive.getDriveSize();

			await this.getFiles();

			this.getSize();

			this.startTime = Date.now();

			while (this.files.length > 0) {
				if (this.currentFiles.length >= this.maxCurrent) {

					await new Promise(function(resolve, reject) {
						context.unlock = resolve;
					});
				}

				let file = this.files[0];

				this.files.shift();

				this.currentFiles.push(file);

				this.download(file, function() {
					if (context.unlock) {
						context.currentFiles.splice(context.currentFiles.indexOf(file), 1);

						context.unlock();

						context.unlock = null;
					}
				});
			}

			while (context.currentFiles.length > 0) {
				await new Promise(function(resolve, reject) {
					context.unlock = resolve;
				});
			}
		}

		var stop = setInterval(function() {
			if (context.currentFiles.length != 0) return;

			Log.stop();

			clearInterval(stop);
		}, 1000/4);
	}

	static async download(file, callback) {
		while (true) {
			try {
				file.sizeDownloaded = 0;
				file.currentInstant = 0;
				file.currentBytes = 0;
				file.startTime = Date.now();

				let stream = Util.writeStream("download", file.name);

				var f = await Drive.downloadFile(file.id);

				var last = Date.now();

				var context = this;

				await new Promise(async function(resolve, reject) {
					f.data.on("data", function(data) {
						stream.write(data);

						file.currentBytes = data.length;

						context.totalSizeDownloaded += file.currentBytes;

						file.sizeDownloaded += file.currentBytes;

						file.currentInstant = Date.now() - last;

						last = Date.now();

						if (file.sizeDownloaded == file.size) {
							resolve();
						}
					});
				});

				await Drive.deleteFile(file.id);

				Drive.subtractSize(file.size);

				break;
			} catch (e) {
				console.error(e);

				await Util.delay(250);
			}
		}

		callback();
	}
}

Download.Init();