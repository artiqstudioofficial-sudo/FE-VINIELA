// src/services/contactService.ts
import { ContactMessage } from "../types";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";
const CONTACT_API = `${API_BASE}/api/contact-messages`;

/* -------------------------------------------------------------------------- */
/*                              Helper fetch JSON                             */
/* -------------------------------------------------------------------------- */

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body && (body as any).error) {
        message = (body as any).error;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/* -------------------------------------------------------------------------- */
/*                              Contact Messages                              */
/* -------------------------------------------------------------------------- */

interface ContactMessagesResponse {
  data: ContactMessage[];
}

/**
 * Ambil semua pesan contact
 * GET /api/contact-messages
 */
export const getContactMessages = async (): Promise<ContactMessage[]> => {
  const resp = await fetchJson<ContactMessagesResponse>(CONTACT_API);
  return resp.data;
};

/**
 * Simpan satu pesan contact (dipakai form "Contact Us")
 * POST /api/contact-messages
 *
 * Body:
 *  {
 *    name: string;
 *    email: string;
 *    subject: string;
 *    message: string;
 *  }
 *
 * Backend akan generate id & date (created_at)
 */
export const saveContactMessage = async (
  messageData: Omit<ContactMessage, "id" | "date">
): Promise<ContactMessage> => {
  const resp = await fetchJson<{ data: ContactMessage }>(CONTACT_API, {
    method: "POST",
    body: JSON.stringify(messageData),
  });

  return resp.data;
};

/**
 * Hapus satu pesan contact
 * DELETE /api/contact-messages/:id
 */
export const deleteContactMessage = async (
  messageId: string
): Promise<void> => {
  await fetchJson<{ ok: boolean }>(`${CONTACT_API}/${messageId}`, {
    method: "DELETE",
  });
};
