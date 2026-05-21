export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "interviewed"
  | "hired"
  | "rejected";

export interface AppReplyLog {
  sentAt: string;
  body: string;
  type: "outbound" | "inbound";
  agentName?: string;
  fromEmail?: string;
  emailMessageId?: string;
  seen?: boolean;
}

export interface Application {
  id: string;
  jobTitle: string;
  dept: string;
  location: string;
  name: string;
  email: string;
  phone: string;
  cover: string;
  cvName?: string;
  cvData?: string;
  appliedAt: string;
  status: ApplicationStatus;
  replies?: AppReplyLog[];
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

export const addApplicationReply = (id: string, reply: AppReplyLog): Application[] => {
  const apps = getApplications().map((a) =>
    a.id === id ? { ...a, replies: [...(a.replies ?? []), reply] } : a
  );
  localStorage.setItem(KEY, JSON.stringify(apps));
  return apps;
};

export const markApplicationRepliesSeen = (id: string): Application[] => {
  const apps = getApplications().map((a) => {
    if (a.id !== id) return a;
    return {
      ...a,
      replies: a.replies?.map((r) =>
        r.type === "inbound" && !r.seen ? { ...r, seen: true } : r
      ),
    };
  });
  localStorage.setItem(KEY, JSON.stringify(apps));
  return apps;
};

export const addInboundApplicationReplies = (
  inbound: Array<{ appId: string; fromEmail: string; body: string; receivedAt: string; emailMessageId: string }>
): { apps: Application[]; added: number } => {
  const list = getApplications();
  let added = 0;

  const updated = list.map((a) => {
    const matches = inbound.filter((r) => r.appId === a.id);
    if (matches.length === 0) return a;

    const existingIds = new Set((a.replies ?? []).map((r) => r.emailMessageId).filter(Boolean));
    const newReplies: AppReplyLog[] = matches
      .filter((r) => !existingIds.has(r.emailMessageId))
      .map((r) => ({
        sentAt: r.receivedAt,
        body: r.body,
        type: "inbound" as const,
        fromEmail: r.fromEmail,
        emailMessageId: r.emailMessageId,
        seen: false,
      }));

    if (newReplies.length === 0) return a;
    added += newReplies.length;
    const allReplies = [...(a.replies ?? []), ...newReplies].sort(
      (x, y) => new Date(x.sentAt).getTime() - new Date(y.sentAt).getTime()
    );
    return { ...a, replies: allReplies };
  });

  localStorage.setItem(KEY, JSON.stringify(updated));
  return { apps: updated, added };
};

export const deleteApplication = (id: string): Application[] => {
  const apps = getApplications().filter((a) => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(apps));
  return apps;
};
