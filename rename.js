import Util from "./util.js";
import Drive from "./drive.js";

class Rename {
	static async Init() {
		Drive.getAccounts();

		this.files = [];

		for (var a = 0; a < Drive.accounts.length; a++) {
			await Drive.authDrive(Drive.accounts[a]);

			await Drive.getDriveInfo();

			var list = await Drive.getDriveFiles();
		
			this.files = this.files.concat(list);

			console.log(Drive.accounts[a]);
			console.log(this.files.length);
		}
	}
}

Rename.Init();