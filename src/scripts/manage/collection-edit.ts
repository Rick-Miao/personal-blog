import { pb } from "../../lib/pocketbase";
import type { CollectionRecord } from "./collection-list";

let editingCollectionId: string | null = null;

// 每次打开或清除编辑器时更新版本
let editVersion = 0;

// 退出登录时清除当前编辑目标
export function clearEditingCollection() {
	editingCollectionId = null;
	editVersion++;
}

export function openCollectionEditor(record: CollectionRecord) {
	// 未登录时不允许打开编辑器
	if (!pb.authStore.isValid || !pb.authStore.record) return;

	const panel = document.querySelector<HTMLElement>("#edit-collection-panel");
	const title = document.querySelector<HTMLElement>("#edit-work-title");
	const status = document.querySelector<HTMLSelectElement>("#edit-status");
	const score = document.querySelector<HTMLInputElement>("#edit-score");
	const progress = document.querySelector<HTMLInputElement>("#edit-progress");
	const comment = document.querySelector<HTMLTextAreaElement>("#edit-comment");
	const published = document.querySelector<HTMLInputElement>("#edit-published");
	const message = document.querySelector<HTMLElement>("#edit-message");

	if (
		!panel ||
		!title ||
		!status ||
		!score ||
		!progress ||
		!comment ||
		!published ||
		!message
	) {
		return;
	}

	editingCollectionId = record.id;
	editVersion++;

	title.textContent = record.expand?.work?.title ?? "未知作品";
	status.value = record.status;
	score.value = String(record.score ?? 0);
	progress.value = String(record.progress ?? 0);
	comment.value = record.comment ?? "";
	published.checked = record.published === true;

	message.textContent = "";
	panel.classList.remove("hidden");

	panel.scrollIntoView({
		behavior: "smooth",
		block: "start",
	});
}

export function initializeEditCollection(onSaveSuccess: () => Promise<void>) {
	const form = document.querySelector<HTMLFormElement>("#edit-collection-form");
	const message = document.querySelector<HTMLElement>("#edit-message");

	if (!form || !message || form.dataset.initialized === "true") return;

	form.dataset.initialized = "true";
	const cancelButton =
		document.querySelector<HTMLButtonElement>("#cancel-edit");

	cancelButton?.addEventListener("click", () => {
		clearEditingCollection();

		const panel = document.querySelector<HTMLElement>("#edit-collection-panel");

		panel?.classList.add("hidden");
		form.reset();
		message.textContent = "";

		const title = document.querySelector<HTMLElement>("#edit-work-title");
		if (title) {
			title.textContent = "";
		}
	});

	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		if (!editingCollectionId || !pb.authStore.isValid || !pb.authStore.record) {
			message.textContent = "请先登录并选择收藏。";
			return;
		}

		const status = form.querySelector<HTMLSelectElement>("#edit-status");
		const score = form.querySelector<HTMLInputElement>("#edit-score");
		const progress = form.querySelector<HTMLInputElement>("#edit-progress");
		const comment = form.querySelector<HTMLTextAreaElement>("#edit-comment");
		const published = form.querySelector<HTMLInputElement>("#edit-published");
		const button = form.querySelector<HTMLButtonElement>(
			'button[type="submit"]',
		);

		if (!status || !score || !progress || !comment || !published || !button) {
			return;
		}

		const scoreValue = Number(score.value);
		const progressValue = Number(progress.value);

		const validStatuses = [
			"wish",
			"in_progress",
			"completed",
			"on_hold",
			"dropped",
		];

		if (
			!validStatuses.includes(status.value) ||
			score.value.trim() === "" ||
			progress.value.trim() === "" ||
			!Number.isInteger(scoreValue) ||
			scoreValue < 0 ||
			scoreValue > 10 ||
			!Number.isInteger(progressValue) ||
			progressValue < 0
		) {
			message.textContent = "请检查收藏状态、评分和进度。";
			return;
		}

		const data = {
			status: status.value,
			score: scoreValue,
			progress: progressValue,
			comment: comment.value,
			published: published.checked,
		};

		// 保存请求开始时的登录会话和编辑目标
		const sessionToken = pb.authStore.token;
		const currentEditVersion = editVersion;
		const collectionId = editingCollectionId;

		const isCurrentEdit = () =>
			pb.authStore.isValid &&
			pb.authStore.token === sessionToken &&
			editVersion === currentEditVersion &&
			editingCollectionId === collectionId;

		button.disabled = true;
		message.textContent = "正在保存修改……";

		try {
			await pb.collection("collections").update(collectionId, data);

			// 退出登录或切换编辑目标后，不再更新旧界面
			if (!isCurrentEdit()) return;

			message.textContent = "修改保存成功！";
			await onSaveSuccess();
		} catch (error) {
			if (!isCurrentEdit()) return;

			console.error("[Edit Collection]", error);
			message.textContent = "保存失败，请检查 Console。";
		} finally {
			// 只让当前编辑操作恢复按钮状态
			if (isCurrentEdit() || editingCollectionId === null) {
				button.disabled = false;
			}
		}
	});
}
