import express from "express";
import Util from "./util.js";

class Server {
	static Init() {
		this.start();

		this.addIndex();

		this.addPublic();

		this.addPreview();
	}

	static start() {
		this.app = express();

		this.app.listen(3000, function() {
			console.log("Ready");
		});
	}

	static addIndex() {
		this.app.get("/", function(req, res) {
			var p = Util.joinPath("public", "index.html");

			var stream = Util.readFile(p);

			stream.pipe(res);
		});
	}

	static addPublic() {
		this.app.get("/public/*", function(req, res) {
			var url = decodeURIComponent(req.url).split("/").slice(2);

			var p = Util.joinPath("public", url[0]);

			var stream = Util.readFile(p);

			stream.pipe(res);
		});
	}

	static addPreview() {
		this.app.get("/preview/*", function(req, res) {
			var url = decodeURIComponent(req.url).split("/").slice(2);

			var p = Util.joinPath("preview", url[0]);

			var stream = Util.readFile(p);

			stream.pipe(res);
		});
	}
}

Server.Init();