import {google} from "googleapis";
import path from "path";
import fs from "fs";

class Drive {
	static async Init() {
		this.auth("credentials2.json");

		this.read();

		this.statistics();

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

		if (this.index == undefined) {
			this.index = 0;
		}

		for (var i = this.index; i < files.length; i++) {
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

	static async upload() {
		while (this.files.length - 1> this.index) {
			var name = this.files[this.index];

			var filename = path.join(".", "upload", name);

			var stream = fs.createReadStream(filename);

			var stats = fs.statSync(filename);

			var context = this;

			var offset = 0;

			this.currentTime = Date.now();
			this.currentSize = stats.size;
			this.currentUploaded = 0;

			await new Promise(async function(resolve, reject) {
				while (true) {
					try {
						var file = await context.drive.files.create({
							requestBody: {
								name: name
							},
							media: {
								body: stream
							}
						}, {
							onUploadProgress: async function(event) {
								context.sizeUploaded += event.bytesRead - offset;
								context.currentUploaded += event.bytesRead - offset;

								offset = event.bytesRead;

								context.log();

								if (event.bytesRead == stats.size) {
									context.index += 1;

									console.log("");

									context.delete(name, stats.size.toString(), filename);

									await new Promise(function(resolve2, reject2) {
										setTimeout(resolve2, 250);
									});
									
									return resolve();
								}
							}
						});
						break;
					} catch (e) {
						console.error(e);
						break;
					}
				}
			});

			this.filesUploaded += 1;
		}
	}

	static async delete(name, size, filename) {
		while (true) {
			var list = await this.list();

			for (var i = 0; i < list.length; i++) {
				if (list[i].name == name && list[i].size == size) {
					fs.unlinkSync(filename);

					this.read();

					this.index -= 1;

					return;
				}
			}
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

	static percent() {
		var percent = Math.floor(this.currentUploaded / this.currentSize * 100 * 100) / 100;

		return percent;
	}

	static speed() {
		return this.formatSize(Math.floor(this.currentUploaded/(Date.now() - this.currentTime) * 1000 * 100) / 100);
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
		t += "Total:";
		t += " ";
		t += "\x1b[0m";
		t += this.spentTime();

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "Current:"
		t += " ";
		t += "\x1b[0m";
		t += this.currentSpentTime();

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "Files:";
		t += " ";
		t += "\x1b[0m";
		t += "\x1b[33m";
		t += this.files.length - this.index;
		t += "\x1b[0m";

		t += " ";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "Name:";
		t += "\x1b[0m";
		t += " ";
		t += this.files[this.index];

		t += " ";

		t += "\x1b[33m";
		t += this.percent();
		t += "%";

		t += " ";

		t += "\x1b[0m";
		t += this.formatSize(this.currentUploaded);
		t += "/";
		t += this.formatSize(this.currentSize);

		t += " ";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "Speed:";
		t += "\x1b[0m";
		t += " ";
		t += this.speed();
		t += "/s";

		t += " ";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "Current:";
		t += " ";
		t += "\x1b[0m";
		t += this.currentLeftTime();

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "Total:";
		t += " ";
		t += "\x1b[0m";
		t += this.leftTime();

		while (t.length - 110 < process.stdout.columns) {
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