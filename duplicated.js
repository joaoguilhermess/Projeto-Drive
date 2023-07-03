import Util from "./util.js";
import Drive from "./drive.js";

class Duplicated {
	static async Init() {
		Drive.getAccounts();

		this.files = [];

		for (var a = 0; a < Drive.accounts.length; a++) {
			await Drive.authDrive(Drive.accounts[a]);

			await Drive.getDriveInfo();

			var context = this;
			await Drive.iterateDriveFiles(async function(files) {
				for (var i = 0; i < files.length; i++) {
					// console.log(files[i].name, files[i].size, context.files.length);

					if (!context.files.includes(files[i].name + files[i].size)) {
						context.files.push(files[i].name + files[i].size);
					} else {
						console.log("duplicated: ", files[i].name, files[i].size);

						await Drive.deleteFile(files[i].id);
					}
				}
			});
		}
	}
}

Duplicated.Init();