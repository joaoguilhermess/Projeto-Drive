import Util from "./util.js";

export default class Log {
	static start(condition, callbacks) {
		var context = this;

		this.line = [];

		var timer = setInterval(function() {
			if (condition()) {
				for (var i = 0; i < callbacks.length; i++) {
					callbacks[i]();
				}

				context.colorReset();

				context.convertLog();

				process.stdout.write(context.line);

				context.line = [];
			}
		}, 1000/4);

		this.timer = timer;
	}

	static stop() {
		clearInterval(this.timer);
	}

	static write(item) {
		this.line.push(item);
	}

	static next() {
		console.log("");
	}

	static colorGray() {
		this.write(["\x1b[1m", "\x1b[30m"]); //Gray
	}

	static colorYelow() {
		this.write(["\x1b[0m", "\x1b[33m"]); //Yelow
	}

	static colorReset() {
		this.write(["\x1b[0m"]); //Reset
	}

	static convertLog() {
		var line = "\r";

		var length = 0;

		for (var i = 0; i < this.line.length; i++) {
			if (typeof this.line[i] == "object") {
				for (var l = 0; l < this.line[i].length; l++) {
					line += this.line[i][l];
				}
			} else if (typeof this.line[i] == "string" || typeof this.line[i] == "number") {
				this.line[i] = this.line[i].toString();

				if (length + this.line[i].length + 1 < process.stdout.columns) {
					var t = this.line[i] + " ";

					line += t;
					length += t.length;
				} else {
					var t = this.line[i].slice(0, process.stdout.columns - length);

					line += t;
					length += t.length;
				}
			}
		}

		while (length < process.stdout.columns) {
			line += " ";
			length += 1;
		}

		this.line = line;
	}
}