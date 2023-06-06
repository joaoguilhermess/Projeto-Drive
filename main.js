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

	static async startUploader() {
		Log.start();

		for (var a = 0; a < this.accounts.length; a++) {
			this.authDrive(this.accounts[a]);

			await this.getDriveInfo();

			this.getDriveSize();

			this.getFiles();

			for (var f = 0; f < this.files.length; f++) {
				var filename = path.join("./", "upload", this.files[f]);

				var stats = fs.lstatSync(filename);

				if (this.info.storageQuota.limit < this.info.storageQuota.usage) {
					var stream = fs.createReadStream(filename);

					Log.next();

					this.currentFile = this.files[f];
					this.currentIndex = f;
					this.currentSize = stats.size;
					this.currentSizeUploaded = 0;

					var context = this;
					await new Promise(function(resolve, reject) {
						context.drive.files.create({
							requestBody: {
								name: context.files[f]
							},
							media: {
								body: stream
							}
						}, {
							onUploadProgress: function(event) {
								context.currentSizeUploaded = event.bytesRead;

								if (event.bytesRead == stats.size) {
									stream.on("close", function() {
										setTimeout(resolve, 250);
									});
								}
							}
						});
					});

					fs.unlinkSync(path.join("./", "upload", this.files[f]));
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

			return aStats.size - bStats.size;
		});
	}

	static formatSize(size) {
		var t = "";

		if (size > 1024 * 1024 * 1024) {
			t = Math.floor(size / (1024 * 1024 * 1024) * 100) / 100;
			t += "gb";
		} else if (size > 1024 * 1024) {
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
}

class Log {
	static log() {
		this.line = [];

		this.logFiles();
		this.logName();
		this.logPercent();
		this.logSize();

		this.colorReset();

		this.convertLog();

		process.stdout.write(this.line);
	}

	static logFiles() {
		this.colorGray();
		this.write("Files:");
		this.colorYelow();
		this.write(Drive.currentIndex);
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
		this.colorYelow();
		this.write((Drive.currentSizeUploaded / Drive.currentSize * 100).toFixed(2) + "%");
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
		}, 1000/10);

		this.timer = timer;
	}

	static stop() {
		clearInterval(this.timer);
	}
}