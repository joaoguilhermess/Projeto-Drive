class Drive {
	static async Init() {
		this.main = document.querySelector(".main");

		this.addScroll();

		await this.getList();

		this.show(0, 50);
	}

	static addScroll() {
		this.main.addEventListener("scroll", function(event) {
			console.log(event.target.scrollHeight, event.target.scrollTop);
		});
	}

	static async getList() {
		var f = await fetch("/public/preview.json");

		var json = await f.json();

		this.list = json;
	}

	static show(index, len) {
		for (var i = index; i < index + len; i++) {
			if (!this.list[i]) {
				break;
			}

			var container = document.createElement("div");
			var image = document.createElement("img");

			container.classList.add("container");
			image.classList.add("image");

			image.src = this.list[i].preview;

			container.append(image);
			this.main.append(container);
		}
	}

	static remove(index, len) {
		var list = Drive.main.children;

		for (var i = index; i < index + len; i++) {
			if (!list[i]) {
				break;
			}

			
		}
	}
}

Drive.Init();