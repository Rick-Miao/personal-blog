import { pb } from "../../lib/pocketbase";
import { openCollectionEditor } from "./collection-edit";
import { loadManagedCollections } from "./collection-list";
import { getSelectedWork } from "./selected-work";

export function initializeSaveCollection() {
	const button = document.querySelector<HTMLButtonElement>("#save-collection");
	const message = document.querySelector<HTMLElement>("#save-message");

	if (!button || !message || button.dataset.initialized) return;

	button.dataset.initialized = "true";

	button.addEventListener("click", async () => {
		const selectedWork = getSelectedWork();

		if (!selectedWork) {
			message.textContent = "请先选择 Bangumi 作品.";
			return;
		}

		if (!pb.authStore.isValid || !pb.authStore.record) {
			message.textContent = "请先登录管理账号.";
			return;
		}

		// 记录当前登录会话
		const sessionToken = pb.authStore.token;

		const isSameSession = () =>
			pb.authStore.isValid && pb.authStore.token === sessionToken;

		const getField = (id: string) =>
			document.getElementById(id) as HTMLInputElement;

		const searchType = getField("search-type").value;

		const workData = {
			title: selectedWork.name_cn || selectedWork.name,
			type: searchType === "2" ? "anime" : "novel",
			bangumi_id: String(selectedWork.id),
			cover_url: selectedWork.images?.common || "",
			description: selectedWork.summary || "",
		};

		const collectionData = {
			status: getField("collection-status").value,
			score: Number(getField("collection-score").value),
			progress: Number(getField("collection-progress").value),
			comment: getField("collection-comment").value,
			published: getField("collection-published").checked,
		};

		const validStatuses = [
			"wish",
			"in_progress",
			"completed",
			"on_hold",
			"dropped",
		];

		if (
			!validStatuses.includes(collectionData.status) ||
			getField("collection-score").value.trim() === "" ||
			getField("collection-progress").value.trim() === "" ||
			!Number.isInteger(collectionData.score) ||
			collectionData.score < 0 ||
			collectionData.score > 10 ||
			!Number.isInteger(collectionData.progress) ||
			collectionData.progress < 0
		) {
			message.textContent = "收藏信息无效，请检查评分和进度。";
			return;
		}

		button.disabled = true;
		message.textContent = "正在保存……";

		let workId: string | null = null;
		let workCreated = false;

		try {
			// 1. 查找已有作品
			const existingWorks = await pb.collection("works").getList(1, 1, {
				filter: pb.filter("bangumi_id = {:id} && type = {:type}", {
					id: workData.bangumi_id,
					type: workData.type,
				}),
			});

			if (!isSameSession()) return;

			if (existingWorks.items.length > 0) {
				workId = existingWorks.items[0].id;
			} else {
				// 2. 创建作品
				const work = await pb.collection("works").create(workData);

				if (!isSameSession()) return;

				workId = work.id;
				workCreated = true;
			}

			// 3. 检查是否已经收藏
			const existingCollections = await pb
				.collection("collections")
				.getList(1, 1, {
					filter: pb.filter("work = {:workId}", { workId }),
				});

			if (!isSameSession()) return;

			if (existingCollections.items.length > 0) {
				message.textContent = "这部作品已经收藏过了, 请不要重复添加.";
				return;
			}

			// 4. 创建收藏
			await pb.collection("collections").create({
				...collectionData,
				work: workId,
			});

			if (!isSameSession()) return;

			message.textContent = "收藏保存成功!";

			await loadManagedCollections(openCollectionEditor);

			console.log("[Collection Save] Success", {
				workId,
				workCreated,
			});
		} catch (error) {
			// 用户已经退出或切换账号时，不再显示旧请求的错误
			if (!isSameSession()) return;

			console.error("[Collection Save]", error);

			message.textContent = workCreated
				? "收藏保存失败: 作品资料可能已创建, 请检查 PocketBase 后重试."
				: "保存失败, 请检查登录权限或网络连接.";
		} finally {
			// 无论请求成功、失败或中途退出，都恢复按钮状态
			button.disabled = false;
		}
	});
}

export function initializeCollectionForm() {
	const form = document.querySelector<HTMLFormElement>("#collection-form");
	const preview = document.querySelector<HTMLElement>("#collection-preview");

	if (!form || !preview || form.dataset.initialized) return;

	form.dataset.initialized = "true";

	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		const selectedWork = getSelectedWork();

		if (!selectedWork) {
			preview.textContent = "请先选择作品。";
			return;
		}

		const field = (id: string) =>
			document.getElementById(id) as HTMLInputElement;

		const selectedType = (
			document.getElementById("search-type") as HTMLSelectElement
		).value;

		const workData = {
			title: selectedWork.name_cn || selectedWork.name,
			type: selectedType === "2" ? "anime" : "novel",
			bangumi_id: String(selectedWork.id),
			cover_url: selectedWork.images?.common || "",
			description: selectedWork.summary || "",
		};

		const collectionData = {
			status: field("collection-status").value,
			score: Number(field("collection-score").value),
			progress: Number(field("collection-progress").value),
			comment: field("collection-comment").value,
			published: field("collection-published").checked,
		};

		preview.textContent = JSON.stringify({ workData, collectionData }, null, 2);

		// 记录发起预览时的登录会话
		const sessionToken = pb.authStore.token;

		const isSameSession = () =>
			pb.authStore.isValid && pb.authStore.token === sessionToken;

		try {
			if (!pb.authStore.isValid || !pb.authStore.record) {
				preview.textContent += "\n\n请先登录管理账号.";
				return;
			}

			// 查询作品是否已经存在
			const existingWorks = await pb.collection("works").getList(1, 1, {
				filter: pb.filter("bangumi_id = {:id} && type = {:type}", {
					id: workData.bangumi_id,
					type: workData.type,
				}),
			});

			// 退出登录后，不再更新预览内容
			if (!isSameSession()) return;

			if (existingWorks.totalItems > 0) {
				preview.textContent += "\n\n该作品已经存在于 works 数据库中.";

				console.log("Existing work:", existingWorks.items[0].id);
			} else {
				preview.textContent += "\n\n该作品尚未收录, 可以新增.";
			}
		} catch (error) {
			// 退出登录后，不显示旧请求的错误信息
			if (!isSameSession()) return;

			console.error("[Duplicate Check]", error);
			preview.textContent += "\n\n重复检测失败, 暂时不能保存.";
		}
	});
}
