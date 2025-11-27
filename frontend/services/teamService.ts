import { TeamMember } from '../types';

const API_BASE = 'http://localhost:4000';
const TEAM_ENDPOINT = `${API_BASE}/api/team`;

export type TeamFormPayload = Omit<TeamMember, 'id'>;

interface ListResponse {
  data: TeamMember[];
}

interface DetailResponse {
  data: TeamMember;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    try {
      const json = await res.json();
      if (json?.error) msg = json.error;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/**
 * Ambil semua anggota team dari backend
 */
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const res = await fetch(TEAM_ENDPOINT, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await handleResponse<ListResponse>(res);
  return json.data;
};

/**
 * Tambah anggota team baru
 */
export const addTeamMember = async (member: TeamFormPayload): Promise<TeamMember> => {
  // Backend hanya butuh title.id & bio.id, tapi aman kalau kita kirim en/cn juga
  const payload = {
    name: member.name,
    title: {
      id: member.title.id,
      en: member.title.en ?? '',
      cn: member.title.cn ?? '',
    },
    bio: {
      id: member.bio.id,
      en: member.bio.en ?? '',
      cn: member.bio.cn ?? '',
    },
    imageUrl: member.imageUrl,
    linkedinUrl: member.linkedinUrl || '',
  };

  const res = await fetch(TEAM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await handleResponse<DetailResponse>(res);
  return json.data;
};

/**
 * Update anggota team
 */
export const updateTeamMember = async (updatedMember: TeamMember): Promise<TeamMember> => {
  const payload = {
    name: updatedMember.name,
    title: {
      id: updatedMember.title.id,
      en: updatedMember.title.en ?? '',
      cn: updatedMember.title.cn ?? '',
    },
    bio: {
      id: updatedMember.bio.id,
      en: updatedMember.bio.en ?? '',
      cn: updatedMember.bio.cn ?? '',
    },
    imageUrl: updatedMember.imageUrl,
    linkedinUrl: updatedMember.linkedinUrl || '',
  };

  const res = await fetch(`${TEAM_ENDPOINT}/${updatedMember.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await handleResponse<DetailResponse>(res);
  return json.data;
};

/**
 * Hapus anggota team
 */
export const deleteTeamMember = async (memberId: string): Promise<void> => {
  const res = await fetch(`${TEAM_ENDPOINT}/${memberId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });

  await handleResponse<{ ok: boolean }>(res);
};
