export type ContactStatus = "new" | "in-progress" | "resolved" | "closed";

export interface ReplyLog {
  sentAt: string;
  agentName: string;
  body: string;
  type?: "outbound" | "inbound";
  fromEmail?: string;
  emailMessageId?: string;
  seen?: boolean;
}

export interface ContactMessage {
  id: string;
  refId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
  status: ContactStatus;
  note?: string;
  replies?: ReplyLog[];
}

const KEY = "highlands_contacts";

export const saveContact = (msg: ContactMessage): void => {
  const existing = getContacts();
  existing.unshift(msg);
  localStorage.setItem(KEY, JSON.stringify(existing));
};

export const getContacts = (): ContactMessage[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const updateContactStatus = (id: string, status: ContactStatus): ContactMessage[] => {
  const msgs = getContacts().map((m) => (m.id === id ? { ...m, status } : m));
  localStorage.setItem(KEY, JSON.stringify(msgs));
  return msgs;
};

export const updateContactNote = (id: string, note: string): ContactMessage[] => {
  const msgs = getContacts().map((m) => (m.id === id ? { ...m, note } : m));
  localStorage.setItem(KEY, JSON.stringify(msgs));
  return msgs;
};

export const addContactReply = (id: string, reply: ReplyLog): ContactMessage[] => {
  const msgs = getContacts().map((m) =>
    m.id === id ? { ...m, replies: [...(m.replies ?? []), reply] } : m
  );
  localStorage.setItem(KEY, JSON.stringify(msgs));
  return msgs;
};

export const markContactRepliesSeen = (id: string): ContactMessage[] => {
  const msgs = getContacts().map((m) => {
    if (m.id !== id) return m;
    return {
      ...m,
      replies: m.replies?.map((r) =>
        r.type === "inbound" && !r.seen ? { ...r, seen: true } : r
      ),
    };
  });
  localStorage.setItem(KEY, JSON.stringify(msgs));
  return msgs;
};

export const addInboundContactReplies = (
  inbound: Array<{ refId: string; fromEmail: string; body: string; receivedAt: string; emailMessageId: string }>
): { messages: ContactMessage[]; added: number } => {
  const msgs = getContacts();
  let added = 0;

  const updated = msgs.map((m) => {
    const matches = inbound.filter((r) => r.refId === m.refId);
    if (matches.length === 0) return m;

    const existingIds = new Set((m.replies ?? []).map((r) => r.emailMessageId).filter(Boolean));
    const newReplies: ReplyLog[] = matches
      .filter((r) => !existingIds.has(r.emailMessageId))
      .map((r) => ({
        sentAt: r.receivedAt,
        agentName: r.fromEmail,
        body: r.body,
        type: "inbound" as const,
        fromEmail: r.fromEmail,
        emailMessageId: r.emailMessageId,
        seen: false,
      }));

    if (newReplies.length === 0) return m;
    added += newReplies.length;
    const allReplies = [...(m.replies ?? []), ...newReplies].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );
    return { ...m, replies: allReplies };
  });

  localStorage.setItem(KEY, JSON.stringify(updated));
  return { messages: updated, added };
};

export const deleteContact = (id: string): ContactMessage[] => {
  const msgs = getContacts().filter((m) => m.id !== id);
  localStorage.setItem(KEY, JSON.stringify(msgs));
  return msgs;
};
