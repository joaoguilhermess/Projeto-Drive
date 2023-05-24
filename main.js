import {google} from "googleapis";
import path from "path";
import fs from "fs";

class Drive {
	static async Init() {
		this.auth();

		this.read();

		this.upload();
	}

	static auth() {
		var authorization = new google.auth.GoogleAuth({
			keyFile: "credentials.json",
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

		var files = fs.readdirSync("./upload");

		this.files = files;

		this.statistics();
	}

	static statistics() {
		this.startTime = Date.now();
		this.sizeUploaded = 0;
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
		for (var i = 0; i < this.files.length; i++) {
			var name = this.files[i];
			var filename = path.join(".", "upload", name);

			var stream = fs.createReadStream(filename);

			var stats = fs.statSync(filename);

			var context = this;

			var offset = 0;

			var file = await this.drive.files.create({
				requestBody: {
					name: name
				},
				media: {
					body: stream
				}
			}, {
				onUploadProgress: async function(event) {
					context.sizeUploaded += event.bytesRead - offset;

					offset = event.bytesRead;

					var percent = Math.floor(event.bytesRead / stats.size * 100 * 100) / 100;

					context.log(percent);

					if (event.bytesRead == stats.size) {
						await new Promise(async function(resolve, reject) {
							while (true) {
								var list = await context.list();

								for (var i = 0; i < list.length; i++) {
									if (list[i].name == name) {
										return;
									}
								}
							}
						});

						fs.unlinkSync(filename);

						console.log();

						context.read();
					}
				}
			});

			this.filesUploaded += 1;
		}
	}

	static spentTime() {
		var spent = Date.now() - this.startTime;

		var t = "";

		var d = new Date(0, 0, 0, 0, 0, 0, spent + 24 * 60 * 60 * 1000);

		if (d.getDate() - 1) {
			t += d.getDate() - 1 + "d ";
		}

		if (d.getHours()) {
			t += d.getHours() + "h ";
		}

		if (d.getMinutes()) {
			t += d.getMinutes() + "m ";
		}

		if (d.getSeconds()) {
			t += d.getSeconds() + "s ";
		}

		if (d.getMilliseconds()) {
			t += d.getMilliseconds() + "ms ";
		}
		return t;
	}

	static leftTime() {
		var spent = Date.now() - this.startTime;

		var ms = spent/this.sizeUploaded * (this.totalSize - this.sizeUploaded);

		// console.log(spent, this.sizeUploaded, this.totalSize, ms);

		var t = "";

		var d = new Date(0, 0, 0, 0, 0, 0, ms + 24 * 60 * 60 * 1000);

		if (d.getDate() - 1) {
			t += d.getDate() - 1 + "d ";
		}

		if (d.getHours()) {
			t += d.getHours() + "h ";
		}

		if (d.getMinutes()) {
			t += d.getMinutes() + "m ";
		}

		if (d.getSeconds()) {
			t += d.getSeconds() + "s ";
		}

		if (d.getMilliseconds()) {
			t += d.getMilliseconds() + "ms ";
		}

		return t;
	}

	static log(percent) {
		var t = "";

		t += "\r";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "Time Spent:";
		t += " ";
		t += "\x1b[0m";
		t += this.spentTime();

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "Files Left:";
		t += " ";
		t += "\x1b[0m";
		t += "\x1b[33m";
		t += this.files.length;
		t += "\x1b[0m";
		
		t += " ";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "Current:";
		t += "\x1b[0m";
		t += " ";
		t += this.files[0];

		t += " ";

		t += "\x1b[33m";
		t += percent;
		t += "%";

		t += "\x1b[0m";

		t += " ";

		t += "\x1b[1m";
		t += "\x1b[30m";
		t += "Time Left:";
		t += " ";
		t += "\x1b[0m";
		t += this.leftTime();

		while (t.length - 71 < process.stdout.columns) {
			t += " ";
		}

		process.stdout.write(t);
	}

	static async list() {
		var list = await this.drive.files.list({
			fields: "files(*)"
		});

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

	static async delete(id) {
		return this.drive.files.delete({
			fileId: id
		});
	}
}

Drive.Init();