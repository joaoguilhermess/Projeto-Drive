import Util from "./util.js";
import Drive from "./drive.js";
import Log from "./log.js";

class Download {
	static Init() {
		this.delay = 0;

		this.initTime = Date.now();

		this.startLog();

		this.startDownload();
	}

	static startLog() {
		var context = this;

		Log.start(function() {
			if (context.files) {
				return context.files.length != 0;
			}
		}, [
			function logAccount() {
				Log.colorGray();
				Log.write("Account:");
				Log.colorReset();
				Log.write(Drive.info.user.displayName);
			}, function logSpent() {
				var time = Date.now() - context.initTime;

				Log.colorGray();
				Log.write("Spent:");
				Log.colorReset();
				Log.write(Util.formatTime(time));
			}, function logFiles() {
				Log.colorGray();
				Log.write("Files:");
				Log.colorYelow();
				Log.write(context.files.length);
			}, function logName() {
				if (context.currentFile) {
					Log.colorGray();
					Log.write("Name:");
					Log.colorReset();
					Log.write(context.currentFile.name);
				}
			}, function logSize() {
				if (context.currentFile) {
					Log.colorReset();
					Log.write(Util.formatSize(context.currentSizeDownloaded) + "/" + Util.formatSize(context.currentSize));
				}
			}, function logPercent() {
				if (context.currentFile) {
					var percent = context.currentSizeDownloaded / context.currentSize * 100;

					Log.colorYelow();
					Log.write(percent.toFixed(2) + "%");
				}
			}, function logSpeed() {
				if (context.currentFile) {
					var speed = context.currentSizeDownloaded / (Date.now() - context.currentStart) * 1000;

					Log.colorGray();
					Log.write("Speed:");
					Log.colorReset();
					Log.write(Util.formatSize(speed) + "/s");
				}
			}, function logTotalSize() {
				if (context.currentFile) {
					Log.colorGray();
					Log.write("Size:");
					Log.colorReset();
					Log.write(Util.formatSize(context.totalSizeDownloaded) + "/" + Util.formatSize(context.totalSize));
				}
			}, function logLeft() {
				if (context.currentFile) {
					var time = Date.now() - context.startTime;

					time /= context.totalSizeDownloaded;

					time *= context.totalSize;

					Log.colorGray();
					Log.write("Left:");
					Log.colorReset();
					Log.write(Util.formatTime(time));
				}
			}
		]);
	}

	static async getFiles() {
		this.files = []

		var context = this;

		await Drive.iterateDriveFiles(async function(files) {
			for (let i = 0; i < files.length; i++) {
				context.files.push({id: files[i].id, name: files[i].name, size: files[i].size});
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
			this.totalSize += parseInt(this.files[i].size);
		}
	}

	static async startDownload() {
		Drive.getAccounts();

		await Drive.getTotalDriveSize();

		for (let a = 0; a < Drive.accounts.length; a++) {
			await Drive.authDrive(Drive.accounts[a]);

			await Drive.getDriveInfo();

			Drive.getDriveSize();

			await this.getFiles();

			this.getSize();

			this.startTime = Date.now();

			for (this.currentIndex = 0; this.currentIndex < this.files.length; this.currentIndex++) {
				await this.download();
			}			
		}

		Log.stop();
	}

	static async download() {
		while (true) {
			try {
				this.currentFile = this.files[this.currentIndex];
				this.currentSize = this.currentFile.size;
				this.currentSizeDownloaded = 0;
				this.currentInstant = 0;
				this.currentBytes = 0;
				this.currentStart = Date.now();

				let stream = Util.writeStream("download", this.currentFile.name);

				var file = await Drive.downloadFile(this.currentFile.id);

				var last = Date.now();

				var context = this;

				await new Promise(async function(resolve, reject) {
					file.data.on("data", function(data) {
						stream.write(data);

						context.currentBytes = data.length;

						context.totalSizeDownloaded += context.currentBytes;

						context.currentSizeDownloaded += context.currentBytes;

						context.currentInstant = Date.now() - last;

						last = Date.now();

						if (this.currentSizeDownloaded == this.currentSize) {
							setTimeout(resolve, this.delay);
						}
					});
				});

				await Drive.deleteFile(this.currentFile.id);

				this.totalSize -= this.currentSize;
				Drive.subtractSize(this.currentSize);

				this.files.splice(this.currentIndex, 1);
				this.currentIndex -= 1;

				break;
			} catch (e) {
				console.error(e);

				await Util.delay(this.delay);
			}
		}

		Log.next();
	}
}

Download.Init();