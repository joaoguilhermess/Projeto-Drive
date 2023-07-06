import Util from "./util.js";
import Drive from "./drive.js";

class Rename {
	static async Init() {
		this.getFilters();

		Drive.getAccounts();

		this.files = 0;

		var current = 0;
		var max = 10;

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
								current += 1;

								await Drive.renameFile(files[i].id, name);
								console.log(files[i].name, "=>", name);

								current -= 1;
							} else {
								current += 1;

								Drive.renameFile(files[i].id, name).then(function() {
									current -= 1;
								});

								console.log(files[i].name, "=>", name);
							}

							break;
						} else {
							name = files[i].name;

							try {
								var args = name.split(".");
								var args2 = args[0].split("_");

								if (args2[0].length == 8) {
									if (args2[1].length == 6) {
										if (["mp4", "jpg", "heic", "jpeg", "png", "gif"].includes(args[1])) {
											continue;
										}
									}
								}
							} catch {}

							if (k == context.filters.length - 1) {
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
						return args.join("_");
					}
				}
			}
		});

		list.push(function(name) {
			var args = name.split("_");

			if (args[0] == "VID") {
				args = args.slice(1);

				if (args[0].length == 8) {
					var args2 = args[1].split(".");

					if (args2[0].length == 6) {
						return args.join("_");
					}
				}
			}
		});

		list.push(function(name) {
			var	args = name.split("_");

			if (args[0].length == 10) {
				args[0] = args[0].split("-").join("");

				if (args[0].length == 8) {
					return args.join("_");
				}
			}
		});

		list.push(function(name) {
			var args = name.split("_");

			if (args[0] == "Screenshot") {
				if (args.length == 4) {
					args = args.slice(1);

					var a = args[args.length - 1];

					a = a.split(".");

					a = a[a.length - 1];

					args = args.slice(0, -1);

					args[args.length - 1] += "." + a;

					return args.join("_");
				}
			}
		});

		list.push(function(name) {
			var args = name.split("_");

			if (args[0] == "Screenshot") {
				args = args[1];

				args = args.split("-");

				args = [args.slice(0, 3), args.slice(3)];

				args = [args[0].join(""), args[1].join("")];

				return args.join("_");
			}
		});

		list.push(function(name) {
			var args = name.split(".");

			if (args.length == 2) {
				if (args[0].length == 13) {
					if (parseInt(args[0]).toString().length == args[0].length) {
						var d = new Date(parseInt(args[0]));
						
						if (d) {
							var a = "";
							
							a += Util.formatNumber(d.getFullYear(), 4);
							a += Util.formatNumber(d.getMonth() - 1, 2);
							a += Util.formatNumber(d.getDate(), 2);

							a += "_";

							a += Util.formatNumber(d.getHours(), 2);
							a += Util.formatNumber(d.getMinutes(), 2);
							a += Util.formatNumber(d.getSeconds(), 2);

							args[0] = a;

							return args.join(".");
						}
					}
				}
			}
		});

		list.push(function(name) {
			var args = name.split("_");

			if (args[0] == "0img") {
				console.log(new Date(parseInt(args[1])));
			}
		});

		this.filters = list;
	}
}

Rename.Init();