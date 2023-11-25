import Util from "./util.js";
import Drive from "./drive.js";
import fetch from "node-fetch";

class Preview {
	static async Init() {
		Drive.getAccounts();

		var list = [];

		for (var a = 0; a < Drive.accounts.length; a++) {
			await Drive.authDrive(Drive.accounts[a]);

			await Drive.getDriveInfo();

			await Drive.iterateDriveFiles(async function(files) {
				for (let i = 0; i < files.length; i++) {
					if (files[i].thumbnailLink) {
						let f = {
							id: files[i].id,
							name: files[i].name,
							preview: files[i].thumbnailLink,
							original: files[i].webViewLink
						};

						list.push(f);

						process.stdout.write("\r" + list.length + " " + files[i].name);
					}
				}
			});
		}

		if (!Util.verifyPath("preview")) {
			Util.createDir("preview");
		}

		var max = 40;

		var current = 0;

		for (let i = 0; i < list.length; i++) {
			if (!Util.verifyPath("preview", list[i].name)) {
				var p = new Promise(async function(resolve, reject) {
					current += 1;

					let f = await fetch(list[i].preview);

					let stream = Util.writeStream("preview", list[i].name + ".jpg");

					stream.on("close", resolve);

					f.body.pipe(stream);
				}).then(function() {
					current -= 1;
				});

				if (current > max) {
					await p;
				}

				list[i].preview = "/preview/" + list[i].name + ".jpg";

				process.stdout.write("\r" + i + list[i].preview);
			}
		}

		Util.writeFile(Util.joinPath("public", "preview.json"), JSON.stringify(list, null, "\t"));
	}
}

Preview.Init();