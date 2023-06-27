import Util from "./util.js";
import Drive from "./drive.js";
import Log from "./log.js";

class Upload {
	static Init() {
		this.startTime = Date.now();

		this.start();

		Log.Init();
	}

	static getFiles() {
		Util.fixFolders();

		var list = Util.readDir("./", "files");

		Util.sortFiles(list);

		this.files = list;
	}

	static getSize() {
		this.totalSize = 0;
		this.totalSizeUploaded = 0;

		for (var i = 0; i < this.files.length; i++) {
			var stats = Util.readStats("./", "files", this.files[i]);

			this.totalSize += stats.size;
		}
	}

	static async start() {
		var context = this;

		Log.start(function() {
			return context.currentFile != undefined;
		}, [
			function logAccount() {
				Log.colorGray();
				Log.write("Account:");
				Log.colorReset();
				Log.write(Drive.info.user.displayName);
			}, function logSpent() {
				var time = Date.now() - context.startTime;

				Log.colorGray();
				Log.write("Spent:");
				Log.colorReset();
				Log.write(Util.formatTime(time));
			}, function logFiles() {
				Log.colorGray();
				Log.write("Files:");
				Log.colorReset();
				Log.write(context.files.length - context.currentIndex);
			}, function logName() {
				Log.colorGray();
				Log.write("Name:");
				Log.colorReset();
				Log.write(context.currentFile);
			}, function logSize() {
				Log.colorReset();
				Log.write(Util.formatSize(context.currentSizeUploaded) + "/" + Util.formatSize(context.currentSize));
			}, function logPercent() {
				var percent = context.currentSizeUploaded / context.currentSize * 100;

				Log.colorYelow();
				Log.write(percent.toFixed(2) + "%");
			}, function logSpeed() {
				var speed = context.currentSizeUploaded / (Date.now() - context.currentStart) * 1000;

				Log.colorGray();
				Log.write("Speed:");
				Log.colorReset();
				Log.write(Util.formatSize(speed) + "/s");
			}, function logTotalSize() {
				Log.colorGray();
				Log.write("TotalSize:");
				Log.colorReset();
				Log.write(Util.formatSize(context.totalSizeUploaded) + "/" + Util.formatSize(context.totalSize) + "/" + Util.formatSize(Drive.limitSize - Drive.usedSize));
			}, function logLeft() {
				var time = (Date.now() - context.startTime) / context.totalSizeUploaded * (Drive.totalSize - context.totalSizeUploaded);

				var files = context.files.length - context.currentIndex;

				time += 250 * files;

				Log.colorGray();
				Log.write("Left:");
				Log.colorReset();
				Log.write(Util.formatTime(time));
			}
 		]);

		Drive.getAccounts();

		await Drive.getTotalDriveSize();

		this.getFiles();

		this.getSize();

		for (var a = 0; a < Drive.accounts.length; a++) {
			Drive.authDrive(Drive.accounts[a]);

			await Drive.getDriveInfo();

			Drive.getDriveSize();

			for (var f = 0; f < this.files.length; f++) {
				var filename = Util.joinPath("./", "files", this.files[f]);

				var stats = Util.readStats(filename);

				if (Drive.limitSize - Drive.usedSize > stats.size) {
					while (true) {
						try {
							var stream = Util.readFile(filename);

							this.currentFile = this.files[f];
							this.currentIndex = f;
							this.currentSize = stats.size;
							this.currentSizeUploaded = 0;
							this.currentInstant = 0;
							this.currentBytes = 0;
							this.currentStart = Date.now();

							var last = Date.now();

							await Drive.upload(this.currentFile, stream, function(bytesRead, resolve) {
								context.currentBytes = bytesRead - context.currentSizeUploaded;

								context.totalSizeUploaded += context.currentBytes;

								context.currentSizeUploaded = bytesRead;

								context.currentInstant = Date.now() - last;

								last = Date.now();

								if (bytesRead == stats.size) {
									stream.on("close", function() {
										setTimeout(resolve, 250);
									});
								}
							});

							this.totalSize -= stats.size;
							Drive.subtractSize(stats.size);

							break;
						} catch (e) {
							console.error(e);

							await Util.delay(250);
						}
					}

					Util.deleteFile("./", "files", this.currentFile);
				}
			}
		}

		Log.stop();
	}
}

Upload.Init();