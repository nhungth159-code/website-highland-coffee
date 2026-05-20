export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "interviewed"
  | "hired"
  | "rejected";

export interface Application {
  id: string;
  jobTitle: string;
  dept: string;
  location: string;
  name: string;
  email: string;
  phone: string;
  cover: string;
  appliedAt: string;
  status: ApplicationStatus;
}

const KEY = "highlands_applications";

export const saveApplication = (app: Application): void => {
  const existing = getApplications();
  existing.unshift(app);
  localStorage.setItem(KEY, JSON.stringify(existing));
};

export const getApplications = (): Application[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const updateApplicationStatus = (
  id: string,
  status: ApplicationStatus
): Application[] => {
  const apps = getApplications().map((a) =>
    a.id === id ? { ...a, status } : a
  );
  localStorage.setItem(KEY, JSON.stringify(apps));
  return apps;
};

export const deleteApplication = (id: string): Application[] => {
  const apps = getApplications().filter((a) => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(apps));
  return apps;
};
