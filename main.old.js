import {google} from "googleapis";
import path from "path";
import fs from "fs";

class Drive {
	static async Init() {
		this.auth("credentials2.json");

		this.read();

		this.statistics();

		await this.quota();

		await this.upload();
	}

	static auth(file) {
		var authorization = new google.auth.GoogleAuth({
			keyFile: file,
			scopes: ["https://www.googleapis.com/auth/drive"]
		});

		var drive = google.drive({
			version: "v3",
			auth: authorization
		});

		this.drive = drive;
	}

	static read() {
		if (!fs.existsSync("./upload")) {
			fs.mkdirSync("./upload");
		}

		var result = [];

		var files = fs.readdirSync("./upload");

		for (var i = 0; i < files.length; i++) {
			var stats = fs.lstatSync(path.join("./upload", files[i]));

			if (stats.isDirectory()) {
				var list = fs.readdirSync(path.join("./upload", files[i]));

				for (var l = 0; l < list.length; l++) {
					var stats = fs.lstatSync(path.join("./upload", files[i], list[l]));

					if (stats.isFile()) {
						fs.renameSync(path.join("./upload", files[i], list[l]), path.join("./upload", list[l]));
					}
				}

				fs.rmdirSync(path.join("./upload", files[i]));
			}
		}

		var files = fs.readdirSync("./upload");

		this.files = files;
	}

	static statistics() {
		this.startTime = Date.now();
		this.sizeUploaded = 0;
		this.currentTime = Date.now();
		this.currentSize = 0;
		this.currentUploaded = 0;
		this.filesUploaded = 0;

		this.totalSize = 0;

		for (var i = 0; i < this.files.length; i++) {
			var name = this.files[i];
			var filename = path.join("./", "upload", name);

			var stats = fs.statSync(filename);

			this.totalSize += stats.size;
		}
	}

	static async quota() {
		var quota = await this.drive.about.get({
			fields: "*"
		});

		this.freeStorage = parseInt(quota.data.storageQuota.limit) - parseInt(quota.data.storageQuota.usage);
	}

	static async upload() {
		while (this.files.length > 0) {
			var name = this.files[0];

			var filename = path.join(".", "upload", name);

			var stream = fs.createReadStream(filename);

			var stats = fs.statSync(filename);

			var context = this;

			var interval = Date.now();

			this.currentTime = Date.now();
			this.currentSize = stats.size;
			this.currentUploaded = 0;
			this.currentInterval = 0;
			this.currentBytes = 0;
			this.currentLastSpeed = 0;

			if (this.freeStorage < stats.size) {
				break;
			}

			await new Promise(async function(resolve, reject) {
				while (true) {
					try {
						var file = await context.drive.files.create({
							requestBody: {
								name: name
							},
							media: {
								body: stream,
								size: stats.size
							}
						}, {
							onUploadProgress: async function(event) {
								// console.log(event);
								context.sizeUploaded += event.bytesRead - context.currentUploaded;
								context.currentBytes = event.bytesRead - context.currentUploaded;

								context.currentUploaded = event.bytesRead;

								context.currentInterval = Date.now() - interval;

								interval = Date.now();

								context.log();

								if (event.bytesRead == stats.size) {
									console.log("");

									await new Promise(function(resolve2, reject2) {
										stream.on("close", function() {
											fs.unlinkSync(filename);

											context.freeStorage += stats.size;

											context.read();

											setTimeout(resolve2, 250);
										});
									});
									
									return resolve();
								}
							}
						});
						break;
					} catch (e) {
						await new Promise(function(resolve3, reject3) {
							setTimeout(resolve3, 250);
						});
					}
				}
			});

			this.filesUploaded += 1;
		}
	}

	static spentTime() {
		var spent = Date.now() - this.startTime;

		return this.formatTime(spent);
	}

	static currentSpentTime() {
		var spent = Date.now() - this.currentTime;

		return this.formatTime(spent);
	}

	static currentPercent() {
		var percent = Math.floor(this.currentUploaded / this.currentSize * 100 * 100) / 100;

		return percent;
	}

	static speed() {
		var s = this.currentBytes / (this.currentInterval) * 1000;

		var s2 = (this.currentLastSpeed + s)/2

		this.currentLastSpeed = s;

		return this.formatSize(Math.floor(s2 * 100) / 100);
	}

	static leftTime() {
		var spent = Date.now() - this.startTime;

		var ms = spent/this.sizeUploaded * (this.totalSize - this.sizeUploaded);

		return this.formatTime(ms);
	}

	static currentLeftTime() {
		var spent = Date.now() - this.currentTime;

		var ms = spent/this.currentUploaded * (this.currentSize - this.currentUploaded);

		return this.formatTime(ms);
	}

	static totalPercent() {
		var percent = Math.floor(this.sizeUploaded / this.totalSize * 100 * 100) / 100;

		return percent;
	}

	static formatTime(time) {
		var t = "";

		var d = new Date(0, 0, 0, 0, 0, 0, time + 24 * 60 * 60 * 1000);

		if (d.getDate() - 1) {
			t += this.formatNumber(d.getDate()) - 1 + "d ";
		}

		if (d.getHours()) {
			t += this.formatNumber(d.getHours()) + "h ";
		}

		if (d.getMinutes()) {
			t += this.formatNumber(d.getMinutes()) + "m ";
		}

		if (d.getSeconds()) {
			t += this.formatNumber(d.getSeconds()) + "s ";
		}

		if (d.getMilliseconds()) {
			t += this.formatNumber(d.getMilliseconds(), 4) + "ms ";
		}

		return t;
	}

	static formatNumber(n, l = 2) {
		n = n.toString();

		while (n.length < l) {
			n = " " + n;
		}

		return n;
	}

	static formatSize(size) {
		var t = "";

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

	static log() {
		var t = "";

		t += "\r";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "F:";
		t += " ";
		t += "\x1b[0m";
		t += this.formatSize(this.freeStorage);

		t += " ";
		
		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "T:";
		t += " ";
		t += "\x1b[0m";
		t += this.spentTime();

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "C:"
		t += " ";
		t += "\x1b[0m";
		t += this.currentSpentTime();

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "F:";
		t += " ";
		t += "\x1b[0m";
		t += "\x1b[33m";
		t += this.files.length;
		t += "\x1b[0m";

		t += " ";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "N:";
		t += "\x1b[0m";
		t += " ";
		t += this.files[0];

		t += " ";

		t += "\x1b[33m";
		t += this.currentPercent();
		t += "%";

		t += " ";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "S:";
		t += "\x1b[0m";
		t += " ";
		t += this.speed();
		t += "/s";

		t += " ";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "C:";
		t += " ";
		t += "\x1b[0m";
		t += this.currentLeftTime();

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "T:";
		t += " ";
		t += "\x1b[0m";
		t += this.leftTime();
		
		t += " ";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "C:";
		t += " ";
		t += "\x1b[0m";
		t += this.formatSize(this.currentUploaded);
		t += "/";
		t += this.formatSize(this.currentSize);

		t += " ";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "T:";
		t += " ";
		t += "\x1b[0m";
		t += this.formatSize(this.sizeUploaded);
		t += "/";
		t += this.formatSize(this.totalSize);
		
		t += " ";

		t += "\x1b[33m";
		t += this.totalPercent();

		t += "%";

		t += "\x1b[0m";

		var offset = 141;

		while (t.length - offset < process.stdout.columns) {
			t += " ";
		}

		process.stdout.write(t);
	}

	static async list() {
		var list = await this.drive.files.list({
			fields: "files(name, size)"
		});
			// fields: "files(*)"

		return list.data.files;
	}

	static async upload2(path, filename) {
		var stream = fs.createReadStream(path);

		var stats = fs.statSync(path);

		//folder id 1VWH_lGRxXYXtAlWccIFdbUNCrtBFkZkx
		var file = await this.drive.files.create({
			requestBody: {
				name: filename,
				parents: ["1VWH_lGRxXYXtAlWccIFdbUNCrtBFkZkx"]
			},
			media: {
				body: stream
			}
		}, {
			onUploadProgress: function(event) {
				console.log(Math.floor(event.bytesRead / stats.size * 100 * 100) / 100);
			}
		});

		return new Promise(function(resolve, reject) {
			stream.on("end", resolve);
		});
	}

	static async delete2(id) {
		return this.drive.files.delete({
			fileId: id
		});
	}
}

Drive.Init();