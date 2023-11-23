import Util from "./util.js";
import Drive from "./drive.js";

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
							preview: files[i].thumbnailLink
						};

						list.push(f);
					}
				}

				Util.writeFile(Util.joinPath("public", "preview.json"), JSON.stringify(list, null, "\t"));
			});
		}
	}
}

Preview.Init();