import Util from "./util.js";
import Drive from "./drive.js";

class Rename {
	static async Init() {
		this.getFilters();

		Drive.getAccounts();

		this.files = 0;

		var current = 0;
		var max = 1;

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
							if (current > max) {
								await Drive.renameFile(files[i].id, name);
								console.log(files[i].name, "=>", name);

								current -= 1;
							} else {
								Drive.renameFile(files[i].id, name);
								console.log(files[i].name, "=>", name);

								current += 1;
							}

							break;
						} else {
							name = files[i].name;

							try {
								var args = name.split(".");
								var args2 = args[0].split("_");

								if (args2[0].length == 8) {
									if (args2[1].length == 6) {
										if (["mp4", "jpg", "heic", "jpeg", "png"].includes(args[1])) {
											continue;
										}
									}
								}
							} catch {}

							if (k == 0) {
								console.log(name);
							}
						}
					}
				}
			});
		}
	}

	static getFilters() {
		var list = [];

		list.push(function(name) {
			var args = name.split("-");

			if (args[0] == "IMG") {
				args = args.slice(1);

				args = args.join("_");

				args = args.split(".");

				if (args[0].length == 15) {
					return args.join(".");
				}
			}
		});

		list.push(function(name) {
			var args = name.split("-");

			if (args[0] == "VID") {
				args = args.slice(1);

				args = args.join("_");

				args = args.split(".");

				if (args[0].length == 15) {
					return args.join(".");
				}
			}
		});

		list.push(function(name) {
			var args = name.split(" ");

			if (args[0] == "WhatsApp") {
				if (args[1] == "Image") {
					args = args.slice(2);

					args.splice(1, 1);

					args = args.join("_");

					args = args.split(".");

					args[0] += args[1];
					args[0] += args[2];

					args.splice(1, 2);

					return args.join(".");
				}
			}
		});

		list.push(function(name) {
			var args = name.split("_");

			if (args[0] == "IMG") {
				args = args.slice(1);

				if (args[0].length == 8) {
					var args2 = args[1].split(".");

					if (args2[0].length == 6) {
						console.log(args.join("_"));
					}
				}
			}
		});

		this.filters = list;
	}
}

Rename.Init();