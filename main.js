import {google} from "googleapis";
import path from "path";
import fs from "fs";

class Drive {
	static async Init() {
		this.getAccounts();

		await this.getTotalDriveSize();

		await this.startUploader();
	}

	static getAccounts() {
		var list = fs.readdirSync(path.join("./", "credentials"));

		this.accounts = list;
	}

	static authDrive(account) {
		var authorization = new google.auth.GoogleAuth({
			keyFile: path.join("./", "credentials", account),
			scopes: ["https://www.googleapis.com/auth/drive"]
		});

		this.drive = google.drive({
			version: "v3",
			auth: authorization
		});
	}

	static async getDriveInfo() {
		var about = await this.drive.about.get({
			fields: "*"
		});

		this.info = about.data;
	}

	static getDriveSize() {
		this.limitSize = parseInt(this.info.storageQuota.limit);
		this.usedSize = parseInt(this.info.storageQuota.usage);
	}

	static async getTotalDriveSize() {
		this.totalDriveSize = 0;
		this.totalDriveSizeUsed = 0;
		this.totalDriveSizeFree = 0;

		for (var i = 0; i < this.accounts.length; i++) {
			this.authDrive(this.accounts[i]);

			await this.getDriveInfo();

			this.getDriveSize();

			this.totalDriveSize += this.limitSize;
			this.totalDriveSizeUsed += this.usedSize;
			this.totalDriveSizeFree = this.totalDriveSize - this.totalDriveSizeUsed;
		}
	}

	static getFiles() {
		Util.fixFolders();

		var list = fs.readdirSync(path.join("./", "upload"));

		Util.sortFiles(list);

		this.files = list;
	}

	static getSize() {
		this.totalSize = 0;
		this.totalSizeUploaded = 0;

		for (var i = 0; i < this.files.length; i++) {
			var stats = fs.lstatSync(path.join("./", "upload", this.files[i]));

			this.totalSize += stats.size;
		}
	}

	static async startUploader() {
		Log.start();

		this.startTime = Date.now();

		for (var a = 0; a < this.accounts.length; a++) {
			this.authDrive(this.accounts[a]);

			await this.getDriveInfo();

			this.getDriveSize();

			this.getFiles();

			this.getSize();

			for (var f = 0; f < this.files.length; f++) {
				var filename = path.join("./", "upload", this.files[f]);

				var stats = fs.lstatSync(filename);

				if (this.limitSize - this.usedSize > stats.size) {
					while (true) {
						try {
							var stream = fs.createReadStream(filename);

							this.currentFile = this.files[f];
							this.currentIndex = f;
							this.currentSize = stats.size;
							this.currentSizeUploaded = 0;
							this.currentInstant = 0;
							this.currentBytes = 0;
							this.currentStart = Date.now();

							var last = Date.now();

							var context = this;
							await new Promise(async function(resolve, reject) {
								await context.drive.files.create({
									requestBody: {
										name: context.files[f]
									},
									media: {
										body: stream
									}
								}, {
									onUploadProgress: function(event) {
										context.currentBytes = event.bytesRead - context.currentSizeUploaded;

										context.totalSizeUploaded += context.currentBytes;

										context.currentSizeUploaded = event.bytesRead;

										context.currentInstant = Date.now() - last;

										last = Date.now();

										if (event.bytesRead == stats.size) {
											stream.on("close", function() {
												setTimeout(resolve, 250);
											});
										}
									}
								});
							});

							this.totalSize -= stats.size;
							this.usedSize += stats.size;

							this.totalDriveSizeUsed += stats.size;
							this.totalDriveSizeFree = this.totalDriveSize - this.totalDriveSizeUsed;

							break;
						} catch (e) {
							console.error(e);

							this.totalSizeUploaded -= this.currentSizeUploaded;
							
							await new Promise(function(resolve, reject) {
								setTimeout(resolve, 250);
							});
						}
					}

					fs.unlinkSync(path.join("./", "upload", this.files[f]));

					Log.next();
				}
			}
		}

		Log.stop();
	}
}

Drive.Init();

class Util {
	static fixFolders() {
		var files = fs.readdirSync(path.join("./", "upload"));

		for (var i = 0; i < files.length; i++) {
			var stats = fs.lstatSync(path.join("./", "upload", files[i]));

			if (stats.isDirectory()) {
				var list = fs.readdirSync(path.join("./", "upload", files[i]));

				for (var l = 0; l < list.length; l++) {
					fs.renameSync(path.join("./", "upload", files[i], list[l]), path.join("./", "upload", list[l]));
				}

				fs.rmdirSync(path.join("./", "upload", files[i]));
			}
		}
	}

	static sortFiles(list) {
		list.sort(function(b, a) {
			var aStats = fs.lstatSync(path.join("./", "upload", a));
			var bStats = fs.lstatSync(path.join("./", "upload", b));

			// return bStats.size - aStats.size;
			return aStats.size - bStats.size;
		});
	}

	static formatSize(size) {
		var t = "";

		// if (size > 1024 * 1024 * 1024) {
		// 	t = Math.floor(size / (1024 * 1024 * 1024) * 100) / 100;
		// 	t += "gb";
		// } else 
		if (size > 1024 * 1024) {
			t = Math.floor(size / (1024 * 1024) * 100) / 100;
			t += "mb";
		} else if (size > 1024) {
			t = Math.floor(size / 1024 * 100) / 100;
			t += "kb";
		} else {
			t += "b";
		}

		return t;
	}

	static formatTime(time) {
		var t = [];

		// var d = new Date(0, 0, 0, 0, 0, 0, time);
		var d = new Date(0, 0, 0, 0, 0, 0, time + 24 * 60 * 60 * 1000);

		if (d.getDate() - 1) {
			t.push(d.getDate() - 1 + "d");
		}

		if (d.getHours()) {
			t.push(d.getHours() + "h");
		}

		if (d.getMinutes()) {
			t.push(d.getMinutes() + "m");
		}

		if (d.getSeconds()) {
			t.push(d.getSeconds() + "s");
		}

		if (d.getMilliseconds()) {
			t.push(d.getMilliseconds() + "ms");
		}

		return t.join(" ");
	}
}

class Log {
	static log() {
		this.line = [];

		this.logAccount();
		this.logSpent();
		this.logFiles();
		this.logName();
		this.logPercent();
		this.logSize();
		this.logSpeed();
		this.logTotalSize();
		this.logLeft();

		this.colorReset();

		this.convertLog();

		process.stdout.write(this.line);
	}

	static logAccount() {
		this.colorGray();
		this.write("Account:");
		this.colorReset();
		this.write(Drive.info.user.displayName);
	}

	static logSpent() {
		var time = Date.now() - Drive.startTime;

		this.colorGray();
		this.write("Spent:");
		this.colorReset();
		this.write(Util.formatTime(time));
	}

	static logFiles() {
		this.colorGray();
		this.write("Files:");
		this.colorYelow();
		this.write(Drive.files.length - Drive.currentIndex);
	}

	static logName() {
		this.colorGray();
		this.write("Name:");
		this.colorReset();
		this.write(Drive.currentFile);
	}

	static logSize() {
		this.colorReset();
		this.write(Util.formatSize(Drive.currentSizeUploaded) + "/" + Util.formatSize(Drive.currentSize));
	}

	static logPercent() {
		var percent = Drive.currentSizeUploaded / Drive.currentSize * 100;

		this.colorYelow();
		this.write(percent.toFixed(2) + "%");
	}

	static logSpeed() {
		var speed = Drive.currentSizeUploaded / (Date.now() - Drive.currentStart) * 1000;

		this.colorGray();
		this.write("Speed:");
		this.colorReset();
		this.write(Util.formatSize(speed) + "/s");
	}

	static logTotalSize() {
		this.colorGray();
		this.write("TotalSize:");
		this.colorReset();
		this.write(Util.formatSize(Drive.totalSizeUploaded) + "/" + Util.formatSize(Drive.totalSize) + "/" + Util.formatSize(Drive.limitSize - Drive.usedSize));
	}

	static logLeft() {
		var time = (Date.now() - Drive.startTime) / Drive.totalSizeUploaded * (Drive.totalSize - Drive.totalSizeUploaded);

		this.colorGray();
		this.write("Left:");
		this.colorReset();
		// this.write(Util.formatTime(time));
		this.write(Util.formatTime(Math.abs(time)));
	}

	static write(item) {
		this.line.push(item);
	}

	static next() {
		console.log("");
	}

	static colorGray() {
		this.write(["\x1b[1m", "\x1b[30m"]); //Gray
	}

	static colorYelow() {
		this.write(["\x1b[0m", "\x1b[33m"]); //Yelow
	}

	static colorReset() {
		this.write(["\x1b[0m"]); //Reset
	}

	static convertLog() {
		var line = "\r";

		var length = 0;

		for (var i = 0; i < this.line.length; i++) {
			if (typeof this.line[i] == "object") {
				for (var l = 0; l < this.line[i].length; l++) {
					line += this.line[i][l];
				}
			} else if (typeof this.line[i] == "string" || typeof this.line[i] == "number") {
				this.line[i] = this.line[i].toString();

				if (length + this.line[i].length + 1 < process.stdout.columns) {
					var t = this.line[i] + " ";

					line += t;
					length += t.length;
				} else {
					var t = this.line[i].slice(0, process.stdout.columns - length);

					line += t;
					length += t.length;
					
					// break;
				}
			}
		}

		while (length < process.stdout.columns) {
			line += " ";
			length += 1;
		}

		this.line = line;
	}

	static start() {
		var context = this;

		var timer = setInterval(function() {
			if (Drive.currentFile != undefined) {
				context.log();
			}
		}, 250);

		this.timer = timer;
	}

	static stop() {
		clearInterval(this.timer);
	}
}