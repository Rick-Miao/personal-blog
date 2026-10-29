export interface SelectedWork {
	id: number;
	name: string;
	name_cn?: string;
	images?: {
		common?: string;
	};
	summary?: string;
}

let selectedWork: SelectedWork | null = null;

export function setSelectedWork(work: SelectedWork | null) {
	selectedWork = work;
}

export function getSelectedWork() {
	return selectedWork;
}
