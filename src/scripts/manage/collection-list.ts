import type { RecordModel } from "pocketbase";
import { pb } from "../../lib/pocketbase";
import { clearEditingCollection } from "./collection-edit";

export type CollectionRecord = RecordModel & {
	status: string;
	score: number;
	progress: number;
	comment: string;
	published: boolean;
	expand?: {
		work?: RecordModel & {
			title: string;
			cover_url: string;
		};
	};
};

let latestLoadId = 0;

// 退出登录时，让正在加载的旧请求失效
export function invalidateManagedCollectionsLoad() {
	latestLoadId++;
}

// 显示自定义删除确认弹窗
function confirmCollectionDeletion(workTitle: string): Promise<boolean> {
	const dialog = document.querySelector<HTMLDialogElement>(
		"#delete-collection-dialog",
	);
	const title = document.querySelector<HTMLElement>("#delete-work-title");

	if (!dialog || !title || dialog.open) {
		return Promise.resolve(false);
	}

	if (!pb.authStore.isValid || !pb.authStore.record) {
		return Promise.resolve(false);
	}

	title.textContent = workTitle;
	dialog.returnValue = "";

	const sessionToken = pb.authStore.token;

	return new Promise<boolean>((resolve) => {
		let unsubscribe = () => {};

		const handleClose = () => {
			dialog.removeEventListener("close", handleClose);
			unsubscribe();

			const confirmed =
				dialog.returnValue === "delete" &&
				pb.authStore.isValid &&
				pb.authStore.token === sessionToken;

			title.textContent = "";
			resolve(confirmed);
		};

		dialog.addEventListener("close", handleClose);

		// 如果弹窗打开时退出登录，立即关闭
		unsubscribe = pb.authStore.onChange(() => {
			if (!pb.authStore.isValid || pb.authStore.token !== sessionToken) {
				if (dialog.open) {
					dialog.close("cancel");
				}
			}
		});

		dialog.showModal();
	});
}

export async function loadManagedCollections(
	onEdit: (record: CollectionRecord) => void,
) {
	const container = document.querySelector<HTMLElement>("#manage-list");
	const message = document.querySelector<HTMLElement>("#manage-list-message");

	if (!container || !message) return;

	const loadId = ++latestLoadId;

	if (!pb.authStore.isValid || !pb.authStore.record) {
		message.textContent = "请先登录管理账号。";
		container.replaceChildren();
		return;
	}

	const sessionToken = pb.authStore.token;

	const isSameSession = () =>
		pb.authStore.isValid && pb.authStore.token === sessionToken;

	const canRender = () => loadId === latestLoadId && isSameSession();

	message.textContent = "正在读取收藏……";
	container.replaceChildren();

	try {
		const records = await pb
			.collection("collections")
			.getFullList<CollectionRecord>({
				expand: "work",
				requestKey: null,
			});

		if (!canRender()) return;

		message.textContent = `共 ${records.length} 条收藏`;

		for (const record of records) {
			const work = record.expand?.work;
			if (!work) continue;

			const card = document.createElement("div");
			card.className =
				"flex items-center gap-4 rounded-lg border border-[var(--line-divider)] p-3";

			const cover = document.createElement("img");
			cover.src = work.cover_url || "/favicon.svg";
			cover.alt = work.title;
			cover.className = "w-16 h-20 object-cover rounded";

			const info = document.createElement("div");
			info.className = "flex-1 min-w-0";

			const title = document.createElement("p");
			title.className = "font-bold";
			title.textContent = work.title;

			const details = document.createElement("p");
			details.className = "text-sm opacity-70";
			details.textContent = `${record.status} · ${record.score}/10 · 进度 ${record.progress}`;

			const visibility = document.createElement("p");
			visibility.className = "text-sm opacity-70";
			visibility.textContent = record.published ? "公开" : "私人";

			const actions = document.createElement("div");
			actions.className = "flex flex-col sm:flex-row gap-2 shrink-0";

			// 编辑按钮
			const editButton = document.createElement("button");
			editButton.type = "button";
			editButton.className = "btn-regular rounded-lg px-3 py-2";
			editButton.textContent = "编辑";

			editButton.addEventListener("click", () => {
				if (!canRender()) return;
				onEdit(record);
			});

			// 删除按钮
			const deleteButton = document.createElement("button");
			deleteButton.type = "button";
			deleteButton.className =
				"rounded-lg border border-red-500/50 px-3 py-2 text-red-500 transition-colors hover:bg-red-500/10";
			deleteButton.textContent = "删除";

			deleteButton.addEventListener("click", async () => {
				if (!canRender() || deleteButton.disabled) return;

				// 等待用户确认
				const confirmed = await confirmCollectionDeletion(work.title);

				if (!confirmed || !canRender()) return;

				deleteButton.disabled = true;
				editButton.disabled = true;
				deleteButton.textContent = "删除中……";
				message.textContent = `正在删除「${work.title}」……`;

				try {
					// 只删除收藏记录，不删除作品资料
					await pb.collection("collections").delete(record.id);

					if (!canRender()) return;

					// 清除旧编辑目标
					clearEditingCollection();

					const editPanel = document.querySelector<HTMLElement>(
						"#edit-collection-panel",
					);

					const editForm = document.querySelector<HTMLFormElement>(
						"#edit-collection-form",
					);

					const editTitle =
						document.querySelector<HTMLElement>("#edit-work-title");

					const editMessage =
						document.querySelector<HTMLElement>("#edit-message");

					editPanel?.classList.add("hidden");
					editForm?.reset();

					if (editTitle) {
						editTitle.textContent = "";
					}

					if (editMessage) {
						editMessage.textContent = "";
					}

					// 删除成功后刷新列表
					await loadManagedCollections(onEdit);

					if (isSameSession()) {
						console.log("[Collection Delete] Success", {
							collectionId: record.id,
							workTitle: work.title,
						});
					}
				} catch (error) {
					if (!canRender()) return;

					console.error("[Collection Delete]", error);
					message.textContent = `删除「${work.title}」失败，请检查权限或网络连接。`;
				} finally {
					deleteButton.disabled = false;
					editButton.disabled = false;
					deleteButton.textContent = "删除";
				}
			});

			actions.append(editButton, deleteButton);
			info.append(title, details, visibility);
			card.append(cover, info, actions);
			container.appendChild(card);
		}
	} catch (error) {
		if (!canRender()) return;

		console.error("[Manage Collections]", error);
		message.textContent = "读取收藏失败，请查看 Console。";
	}
}

export function initializeManageList(
	onEdit: (record: CollectionRecord) => void,
) {
	const button = document.querySelector<HTMLButtonElement>(
		"#refresh-collections",
	);

	if (!button || button.dataset.initialized === "true") return;

	button.dataset.initialized = "true";

	button.addEventListener("click", () => {
		void loadManagedCollections(onEdit);
	});

	if (pb.authStore.isValid && pb.authStore.record) {
		void loadManagedCollections(onEdit);
	}
}
