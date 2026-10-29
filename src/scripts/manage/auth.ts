import { pb } from "../../lib/pocketbase";

export function initializeLogin(onLoginSuccess: () => Promise<void>) {
	const form = document.querySelector<HTMLFormElement>("#login-form");
	const message = document.querySelector<HTMLElement>("#login-message");

	if (!form || !message || form.dataset.initialized === "true") {
		return;
	}

	form.dataset.initialized = "true";

	function updateLoginUI() {
		if (!form || !message) return;
		if (pb.authStore.isValid && pb.authStore.record) {
			form.classList.add("hidden");
			message.textContent = `已登录: ${pb.authStore.record.name || "管理员"}`;
		} else {
			form.classList.remove("hidden");
			message.textContent = "请登录管理账号.";
		}
	}

	updateLoginUI();

	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		const email = form.querySelector<HTMLInputElement>("#email");
		const password = form.querySelector<HTMLInputElement>("#password");

		if (!email || !password) return;

		message.textContent = "正在登录……";

		try {
			await pb
				.collection("users")
				.authWithPassword(email.value, password.value);

			form.reset();
			updateLoginUI();

			await onLoginSuccess();
		} catch (error) {
			console.error("[Manage Login]", error);
			message.textContent = "登录或加载收藏失败, 请查看 Console.";
		}
	});
}
