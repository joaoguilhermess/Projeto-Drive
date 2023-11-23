import Util from "./util.js";
import Drive from "./drive.js";

class Preview {
	static async Init() {
		Drive.getAccounts();

		for (var a = 0; a < Drive.accounts.length; a++) {
			await Drive.authDrive(Drive.accounts[a]);

			await Drive.getDriveInfo();

			await Drive.iterateDriveFiles(function(files) {
				for (var i = 0; i < files.length; i++) {
					console.log(files[i].thumbnailLink);
				}
			});
		}
	}
}

Preview.Init();