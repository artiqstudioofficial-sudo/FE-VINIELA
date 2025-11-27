// src/services/partnerService.ts
import { Partner } from '../types';

const API_BASE_URL = 'http://localhost:4000';
const PARTNERS_API_URL = `${API_BASE_URL}/api/partners`;

/**
 * Ambil semua partner dari backend.
 */
export const getPartners = async (): Promise<Partner[]> => {
  const res = await fetch(PARTNERS_API_URL);

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    const msg = errJson?.error || `Gagal memuat partners (status ${res.status})`;
    throw new Error(msg);
  }

  const json = await res.json();
  // backend: { data: PartnerDto[] }
  return Array.isArray(json.data) ? (json.data as Partner[]) : [];
};

/**
 * Tambah partner baru.
 * Body:
 *   { name: string; logoUrl: string }
 */
export const addPartner = async (partner: Omit<Partner, 'id'>): Promise<Partner> => {
  const res = await fetch(PARTNERS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(partner),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    const msg = errJson?.error || `Gagal membuat partner (status ${res.status})`;
    throw new Error(msg);
  }

  const json = await res.json();
  return json.data as Partner;
};

/**
 * Update partner.
 * Body:
 *   { id: string; name: string; logoUrl: string }
 */
export const updatePartner = async (updatedPartner: Partner): Promise<Partner> => {
  const res = await fetch(`${PARTNERS_API_URL}/${updatedPartner.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: updatedPartner.name,
      logoUrl: updatedPartner.logoUrl,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    const msg = errJson?.error || `Gagal mengubah partner (status ${res.status})`;
    throw new Error(msg);
  }

  const json = await res.json();
  return json.data as Partner;
};

/**
 * Hapus partner.
 */
export const deletePartner = async (partnerId: string): Promise<void> => {
  const res = await fetch(`${PARTNERS_API_URL}/${partnerId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    const msg = errJson?.error || `Gagal menghapus partner (status ${res.status})`;
    throw new Error(msg);
  }

  // backend balikin { ok: true } → tidak perlu di-return
};
