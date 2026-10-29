import { pb } from "../../lib/pocketbase";
import { clearEditingCollection } from "./collection-edit";
import { invalidateManagedCollectionsLoad } from "./collection-list";
import { setSelectedWork } from "./selected-work";

export function initializeLogin(onLoginSuccess: () => Promise<void>) {
	const form = document.querySelector<HTMLFormElement>("#login-form");
	const message = document.querySelector<HTMLElement>("#login-message");
	const logoutButton =
		document.querySelector<HTMLButtonElement>("#logout-button");
	const manageCollections = document.querySelector<HTMLElement>(
		"#manage-collections",
	);

	if (
		!form ||
		!message ||
		!logoutButton ||
		form.dataset.initialized === "true"
	) {
		return;
	}

	form.dataset.initialized = "true";

	function updateLoginUI() {
		if (!form || !message || !logoutButton) return;

		if (pb.authStore.isValid && pb.authStore.record) {
			form.classList.add("hidden");
			logoutButton.classList.remove("!hidden");
			manageCollections?.classList.remove("!hidden");

			message.textContent = `已登录: ${pb.authStore.record.name || "管理员"}`;
		} else {
			form.classList.remove("hidden");
			logoutButton.classList.add("!hidden");
			manageCollections?.classList.add("!hidden");

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

	logoutButton.addEventListener("click", () => {
		invalidateManagedCollectionsLoad();
		clearEditingCollection();

		// 1. 清除 PocketBase 认证信息
		pb.authStore.clear();

		// 清除当前选中的 Bangumi 作品
		setSelectedWork(null);

		// 关闭新增收藏面板
		const collectionEditor =
			document.querySelector<HTMLElement>("#collection-editor");

		collectionEditor?.classList.add("hidden");

		// 重置新增收藏表单
		const collectionForm =
			document.querySelector<HTMLFormElement>("#collection-form");

		collectionForm?.reset();

		// 清空作品标题
		const selectedWorkTitle = document.querySelector<HTMLElement>(
			"#selected-work-title",
		);

		if (selectedWorkTitle) {
			selectedWorkTitle.textContent = "";
		}

		// 清空预览内容
		const collectionPreview = document.querySelector<HTMLElement>(
			"#collection-preview",
		);

		if (collectionPreview) {
			collectionPreview.textContent = "";
		}

		// 清空保存状态
		const saveMessage = document.querySelector<HTMLElement>("#save-message");

		if (saveMessage) {
			saveMessage.textContent = "";
		}

		// 2. 清空已经渲染的收藏列表
		const manageList = document.querySelector<HTMLElement>("#manage-list");
		if (manageList) {
			manageList.replaceChildren();
		}

		// 3. 清空列表状态信息
		const manageMessage = document.querySelector<HTMLElement>(
			"#manage-list-message",
		);
		if (manageMessage) {
			manageMessage.textContent = "";
		}

		// 4. 关闭并重置编辑表单
		const editPanel = document.querySelector<HTMLElement>(
			"#edit-collection-panel",
		);
		editPanel?.classList.add("hidden");

		const editForm = document.querySelector<HTMLFormElement>(
			"#edit-collection-form",
		);
		editForm?.reset();

		const editWorkTitle =
			document.querySelector<HTMLElement>("#edit-work-title");
		if (editWorkTitle) {
			editWorkTitle.textContent = "";
		}

		const editMessage = document.querySelector<HTMLElement>("#edit-message");
		if (editMessage) {
			editMessage.textContent = "";
		}

		// 5. 更新登录界面
		updateLoginUI();
	});
}
