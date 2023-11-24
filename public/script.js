class Drive {
	static async Init() {
		this.main = document.querySelector(".main");

		this.selected = {};

		this.index = 0;

		this.addScroll();

		await this.getList();

		this.addAtStart(0, 6 * 10);
	}

	static addScroll() {
		var context = this;

		this.main.addEventListener("scroll", function(event) {
			var max = event.target.scrollHeight - event.target.offsetHeight;

			if (event.target.scrollTop == 0) {
				// context.addAtStart(0, 5);

				// context.removeFromEnd(-5, 5);
			}

			if (event.target.scrollTop >= max -50) {
				// context.add(context.index, 5);

				context.removeFromStart(0, 6);

				context.addAtEnd(context.index, 6);
			}
		});
	}

	static async getList() {
		var f = await fetch("/public/preview.json");

		var json = await f.json();

		json = json.sort(function(a, b) {
			var nameA = a.name.split(".")[0].split("_");
			var nameB = b.name.split(".")[0].split("_");

			if (nameA.length == 2 && nameB.length == 2) {
				nameA = nameA.join();
				nameB = nameB.join();

				if (nameA > nameB) {
					return 1;
				} else {
					return -1;
				}
			}
		});

		this.list = json;
	}

	static addAtStart(index, len) {
		this.index = index;

		var context = this;

		for (var i = index + len; i >= index; i--) {
			if (!this.list[i]) {
				break;
			}

			this.index += 1;

			var container = document.createElement("div");
			var image = document.createElement("img");

			container.classList.add("container");
			image.classList.add("image");

			image.src = this.list[i].preview;

			container.textContent = (i + 1) + " " + this.list[i].name;

			container.addEventListener("click", function(event) {
				var parent = event.target.parentElement;

				if (!parent.classList.contains("selected")) {
					parent.classList.add("selected");

					context.selected[parent.textContent] = true;
				} else {
					parent.classList.remove("selected");

					delete context.selected[parent.textContent];
				}
			});

			container.append(image);
			this.main.prepend(container);
		}
	}

	static addAtEnd(index, len) {
		this.index = index;

		var context = this;

		for (var i = index; i < index + len; i++) {
			if (!this.list[i]) {
				break;
			}

			this.index += 1;

			var container = document.createElement("div");
			var image = document.createElement("img");

			container.classList.add("container");
			image.classList.add("image");

			image.src = this.list[i].preview;

			container.textContent = (i + 1) + " " + this.list[i].name;

			container.addEventListener("click", function(event) {
				var parent = event.target.parentElement;

				if (!parent.classList.contains("selected")) {
					parent.classList.add("selected");

					context.selected[parent.textContent] = true;
				} else {
					parent.classList.remove("selected");

					delete context.selected[parent.textContent];
				}
			});

			container.append(image);
			this.main.append(container);
		}
	}

	static removeFromStart(index, len) {
		var list = Drive.main.children;

		for (var i = index; i < index + len; i++) {
			if (!list[i]) {
				break;
			}

			list[i].remove();
		}
	}

	static removeFromEnd(index, len) {
		var list = Drive.main.children;

		index = (this.main.children.length - 1) + index;

		for (var i = index; i < index + len; i++) {
			if (!list[i]) {
				break;
			}

			list[i].remove();
		}
	}
}

Drive.Init();