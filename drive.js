import {google} from "googleapis";
import Util from "./util.js";

export default class Drive {
	static getAccounts() {
		var list = Util.readDir("./", "credentials");

		this.accounts = list;
	}

	static authDrive(account) {
		var authorization = new google.auth.GoogleAuth({
			keyFile: Util.joinPath("./", "credentials", account),
			scopes: ["https://www.googleapis.com/auth/drive"]
		});

		var drive = google.drive({
			version: "v3",
			auth: authorization
		});

		this.drive = drive;
	}

	static async getDriveInfo() {
		var about = await this.drive.about.get({
			fields: "*"
		});

		this.info = about.data;
	}

	static getDriveSize() {
		this.limitSize = parseInt(this.info.storageQuota.limit);
		this.usedSize = parseInt(this.info.storageQuota.usage);
	}

	static async getTotalDriveSize() {
		this.totalDriveSize = 0;
		this.totalDriveSizeUsed = 0;
		this.totalDriveSizeFree = 0;

		for (var i = 0; i < this.accounts.length; i++) {
			this.authDrive(this.accounts[i]);

			await this.getDriveInfo();

			this.getDriveSize();

			this.totalDriveSize += this.limitSize;
			this.totalDriveSizeUsed += this.usedSize;
			this.totalDriveSizeFree = this.totalDriveSize - this.totalDriveSizeUsed;
		}
	}

	static async getDriveFiles() {
		
	}

	static subtractSize(size) {
		this.usedSize += size;

		this.totalDriveSizeUsed += size;
		this.totalDriveSizeFree = this.totalDriveSize - this.totalDriveSizeUsed;
	}

	static async upload(name, stream, callback) {
		var context = this;

		await new Promise(function(resolve, reject) {
			context.drive.files.create({
				requestBody: {
					name: name
				},
				media: {
					body: stream
				}
			}, {
				onUploadProgress: function(event) {
					callback(event.bytesRead, resolve);
				}
			})
		});
	}

	static async renameFile() {
		
	}

	static async deleteFile() {

	}
}