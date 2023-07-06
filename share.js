import Util from "./util.js";
import Drive from "./drive.js";

class Share {
	static async Init() {
		Drive.getAccounts();

		var current = 0;
		var max = 10;

		for (var a = 0; a < Drive.accounts.length; a++) {
			await Drive.authDrive(Drive.accounts[a]);

			await Drive.getDriveInfo();

			var context = this;
			await Drive.iterateDriveFiles(async function(files) {
				for (var i = 0; i < files.length; i++) {

					if (files[i].shared) {
						if (current > max) {
							for (var k = 0; k < files[i].permissions.length; k++) {
								if (files[i].permissions[k].emailAddress == "jg1453647@gmail.com") {
									current += 1;
			
									console.log("unSharing:", files[i].name);

									await Drive.unShareFile(files[i].id, files[i].permissions[k].id);

									current -= 1;

									break;
								}
							}
						} else {
							for (var k = 0; k < files[i].permissions.length; k++) {
								if (files[i].permissions[k].emailAddress == "jg1453647@gmail.com") {
									current += 1;

									console.log("unSharing:", files[i].name);

									Drive.unShareFile(files[i].id, files[i].permissions[k].id).then(function() {
										current -= 1;
									});

									break;
								}
							}
						}
					} else {
						console.log("not shared:", files[i].name);
					}
				}

				// for (var i = 0; i < files.length; i++) {
				// 	console.log(files[i]);

				// 	continue;

				// 	var name = files[i].name;

				// 	name = name.split(".");

				// 	name = name[0];

				// 	name = name.split("_");

				// 	if (name[0].length == 8) {
				// 		if (name[1].length == 6) {
				// 			if (!files[i].shared) {
				// 				try {
				// 					if (current > max) {
				// 						await Drive.shareFile(files[i].id, "jg1453647@gmail.com");

				// 						console.log("shared:", files[i].name);
								
				// 						current -= 1;
				// 					} else {
				// 						Drive.shareFile(files[i].id, "jg1453647@gmail.com").catch(function() {});

				// 						console.log("shared:", files[i].name);

				// 						current += 1;
				// 					}
				// 				} catch (e) {
				// 					console.log(e);
				// 				}
				// 			}
				// 		}
				// 	}
				// }
			});
		}
	}
}

Share.Init();