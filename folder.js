import Util from "./util.js";

class Folder {
	static Init() {
		var folder = "./download";

		var files = Util.readDir(folder);

		for (let i = 0; i < files.length; i++) {
			let stats = Util.readStats("./download", files[i]);

			if (stats.isFile()) {
				let args = files[i].split(".");

				let name = args[0].split("_");

				if (name.length != 2) continue;
				if (name[0].length != 8) continue;
				if (name[1].length != 6) continue;
				if (!["jpg", "png", "mp4", "jpeg", "gif", "heic"].includes(args[1])) continue;

				let year = name[0].slice(0, 4);

				if (year != parseInt(year).toString()) continue;

				if (!Util.verifyPath(folder, year)) {
					Util.createDir(folder, year);
				}

				let rename = Util.joinPath(folder, year, files[i]);

				if (Util.verifyPath(rename)) {
					console.log("Duplicated:", files[i]);
				} else {
					Util.renameFile(Util.joinPath(folder, files[i]), rename);
				}
			}
		}
	}
}

Folder.Init();