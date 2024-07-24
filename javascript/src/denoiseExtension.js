import zyX, { html, css } from "./zyX-es6.js";

export default class DenoiserControlExtender {
	constructor(beterprompt) {
		this.beterprompt = beterprompt;
		this.noiseControls = this.beterprompt.queryTabAll(
			(tab) => `#${tab}_denoising_strength input`
		);
		this.images = [
			...this.beterprompt.queryTabAll(
				(tab) => "#img2img_settings > .tabs .image-container"
			),
		];
		for (const control of this.noiseControls)
			control.addEventListener("input", this.onInput.bind(this));
	}

	getSelectedTab() {
		return this.images.find(
			(image) => image.closest(".tabitem").style.display === "block"
		);
	}

	onInput() {
		const noise = this.noiseControls[0].value;
		const previewImage = this.getSelectedTab().querySelector("img");
		previewImage.style.filter = `blur(${noise * (previewImage.naturalWidth / 500)}px)`;
		zyX(this).delay("onInput", 1000, () => {
			previewImage.style.filter = "";
			return false;
		});
	}
}
