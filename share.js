import Util from "./util.js";
import Drive from "./drive.js";

class Share {
	static async Init() {
		Drive.getAccounts();

		var current = 0;
		var max = 50;

		for (var a = 0; a < Drive.accounts.length; a++) {
			await Drive.authDrive(Drive.accounts[a]);

			await Drive.getDriveInfo();

			console.log("Account:", Drive.accounts[a]);

			var iterated = 0;

			await Drive.iterateDriveFiles(async function(files) {
				for (let i = 0; i < files.length; i++) {
					try {
						iterated += 1;

						process.stdout.write("\rIterated: " + iterated);

						let name = files[i].name;

						name = name.split(".");

						name = name[0];

						name = name.split("_");

						if (name[0].length == 8) {
							if (name[1].length == 6) {
								if (!files[i].shared) {
									try {
										if (current > max) {
											current += 1;

											await Drive.shareFile(files[i].id, "jg1453647@gmail.com");

											// process.stdout.write("\rIterated: " + iterated + " shared: " + files[i].name);
											process.stdout.write("\rIterated: " + iterated);
									
											current -= 1;
										} else {
											current += 1;
											
											Drive.shareFile(files[i].id, "jg1453647@gmail.com").then(function() {
												current -= 1;

												// process.stdout.write("\rIterated: " + iterated + " shared: " + files[i].name);
												process.stdout.write("\rIterated: " + iterated);
											}).catch(function(e) {
												current -= 1;
											});
										}
									} catch (e) {
										console.log(e);
									}
								}
							}
						}
					} catch (e) {
					}
				}
			});

			console.log("");
		}
	}
}

Share.Init();