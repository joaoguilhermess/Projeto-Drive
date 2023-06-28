import fs from "fs";
import path from "path";

export default class Util {
	static joinPath(...args) {
		return path.join(...args);
	}

	static readDir(...args) {
		return fs.readdirSync(this.joinPath(...args));
	}

	static readFile(...args) {
		return fs.createReadStream(this.joinPath(...args));
	}

	static readStats(...args) {
		return fs.lstatSync(this.joinPath(...args));
	}

	static renameFile(from, to) {
		fs.renameSync(from, to);
	}

	static deleteDir(...args) {
		fs.rmdirSync(this.joinPath(...args));
	}

	static deleteFile(...args) {
		fs.unlinkSync(this.joinPath(...args));
	}

	static fixFolders() {
		var files = this.readDir("./", "files");

		for (var i = 0; i < files.length; i++) {
			var stats = this.readStats("./", "files", files[i]);

			if (stats.isDirectory()) {
				var list = this.readDir("./", "files", files[i]);

				for (var l = 0; l < list.length; l++) {
					this.renameFile(this.joinPath("./", "files", files[i], list[l]), this.joinPath("./", "files", list[l]));
				}

				this.deleteDir("./", "files", files[i]);
			}
		}
	}

	static sortFiles(files) {
		files.sort(function(b, a) {
			var aStats = this.readStats("./", "files", a);
			var bStats = this.readStats("./", "files", b);

			return aStats.size - bStats.size;
		});
	}

	static formatSize(size) {
		var t = "0";

		var gb = 1024 * 1024 * 1024;
		var mb = 1024 * 1024;
		var kb = 1024;

		if (size > gb) {
			t = Math.floor(size / gb * 100) / 100;
			t += "gb";
		} else if (size > mb) {
			t = Math.floor(size / mb * 100) / 100;
			t += "mb";
		} else if (size > kb) {
			t = Math.floor(size / kb * 100) / 100;
			t += "kb";
		} else {
			t = size;
			t += "b";
		}

		return t;
	}

	static formatTime(time) {
		var t = [];

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

		t = t.join(" ");

		return t;
	}

	static async delay(time) {
		await new Promise(function(resolve, reject) {
			setTimeout(resolve, time);
		});
	}
}