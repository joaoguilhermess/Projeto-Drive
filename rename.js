import Util from "./util.js";
import Drive from "./drive.js";

class Rename {
	static async Init() {
		Drive.getAccounts();

		this.files = 0;

		this.filters = [
			function(name) {
				var args = name.split("-");

				if (args[0] == "IMG") {
					args = args.slice(1);

					args = args.join("_");

					args = args.split(".");

					if (args[0].length == 15) {
						return args.join(".");
					}
				}

				return;
			}
		];

		for (var a = 0; a < Drive.accounts.length; a++) {
			await Drive.authDrive(Drive.accounts[a]);

			await Drive.getDriveInfo();

			var context = this;
			await Drive.iterateDriveFiles(async function(files) {
				for (var i = 0; i < files.length; i++) {
					var name = files[i].name;

					for (var k = 0; k < context.filters.length; k++) {
						name = context.filters[k](name);

						if (name) {
							console.log(files[i].name, "=>", name);
							console.log(await Drive.renameFile(files[i].id, name));

							break;
						} else {
							name = files[i].name;

							console.log(name);
						}
					}
				}
			});
		}
	}
}

Rename.Init();