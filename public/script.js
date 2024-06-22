class Drive {
	static async Init() {
		this.main = document.querySelector(".main");

		this.columns = 6;
		this.rows = 5;
		this.height = 3;
		this.size = this.columns * this.rows;

		this.index = 0;

		this.addScroll();

		await this.getList();

		this.addAtEnd(0, this.size);

		// var interval;

		// window.addEventListener("keypress", function(event) {
		// 	if (event.key == "g") {
		// 		try {
		// 			clearInterval(interval);
		// 		} catch {}

		// 		interval = setInterval(function() {
		// 			Drive.main.scrollBy(0, 768/1);
		// 		}, 1000/24);
		// 	} else if (event.key == "t") {
		// 		clearInterval(interval);
		// 	}
		// });
	}

	static addScroll() {
		var context = this;

		this.main.addEventListener("scroll", function(event) {
			var max = event.target.scrollHeight - event.target.offsetHeight;

			if (event.target.scrollTop <= 50) {
				var index = context.index - context.size - 6;

				if (index >= 0) {
					context.addAtStart(index, context.columns);

					context.main.scrollTop = document.body.offsetHeight/context.height;

					context.removeFromEnd(context.columns);
				}
			}

			if (event.target.scrollTop >= max -50) {
				context.addAtEnd(context.index, context.columns);

				context.removeFromStart(context.columns);
			}
		});
	}

	static async getList() {
		var f = await fetch("/public/preview.json");

		var list = await f.json();

		for (var i = 0; i < list.length; i++) {
			var n = list[i].name.split("_");

			if (n.length == 2) {
				if (n[0].length == 8) {
					continue;
				}
			}

			list.splice(i, 1);

			i--;
		}

		list = list.sort(function(a, b) {
			var nameA = a.name.split(".")[0].split("_");
			var nameB = b.name.split(".")[0].split("_");

			if (nameA.length == 2 && nameB.length == 2) {
				nameA = nameA.join();
				nameB = nameB.join();

				if (nameA > nameB) {
					// return 1;
					return -1;
				} else {
					// return -1;
					return 1;
				}
			} else {
				return -999;
			}
		});

		this.list = list;
	}

	static addAtStart(index, len) {
		var context = this;

		for (var i = index + (len - 1); i >= index; i--) {
			if (!this.list[i]) {
				break;
			}

			this.index -= 1;

			var container = document.createElement("div");
			var image = document.createElement("img");
			var title = document.createElement("div");

			container.classList.add("container");
			image.classList.add("image");
			title.classList.add("title");

			image.src = this.list[i].preview;

			title.textContent = (i + 1) + " " + this.list[i].name;

			container.preview = this.list[i];

			container.addEventListener("click", function(event) {
				if (event.target.parentElement.classList.contains("container")) {
					window.open(event.target.parentElement.preview.original);
				}
			});

			container.append(title);
			container.append(image);
			this.main.prepend(container);
		}
	}

	static addAtEnd(index, len) {
		var context = this;

		for (var i = index; i < index + len; i++) {
			if (!this.list[i]) {
				break;
			}

			this.index += 1;

			var container = document.createElement("div");
			var image = document.createElement("img");
			var title = document.createElement("div");

			container.classList.add("container");
			image.classList.add("image");
			title.classList.add("title");

			image.src = this.list[i].preview;

			title.textContent = (i + 1) + " " + this.list[i].name;

			container.preview = this.list[i];

			container.addEventListener("click", function(event) {
				if (event.target.parentElement.classList.contains("container")) {
					window.open(event.target.parentElement.preview.original);
				}
			});

			container.append(title);
			container.append(image);
			this.main.append(container);
		}
	}

	static removeFromStart(len) {
		var list = Drive.main.children;

		if (list.length > this.size) {
			for (var i = 0; i < len; i++) {
				if (!list[0]) {
					break;
				}

				list[0].remove();
			}
		}
	}

	static removeFromEnd(len) {
		var list = Drive.main.children;

		if (list.length > this.size) {
			for (var i = 0; i < len; i++) {
				if (!list[this.main.children.length - 1]) {
					break;
				}

				list[this.main.children.length - 1].remove();
			}
		}
	}
}

Drive.Init();