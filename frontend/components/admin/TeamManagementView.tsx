import React, { FormEvent, useEffect, useMemo, useState } from 'react';

import { useTranslations } from '../../contexts/i18n';

import ConfirmationModal from '../../components/ConfirmationModal';
import ImageUploader from '../../components/ImageUploader';

import * as teamService from '../../services/teamService';

import { TeamMember } from '../../types';

type ToastFn = (message: string, type?: 'success' | 'error') => void;

interface TeamManagementViewProps {
  showToast: ToastFn;
}

// State awal form anggota tim (tanpa id, 1 bahasa)
const emptyTeamMember: Omit<TeamMember, 'id'> = {
  name: '',
  title: {
    id: '',
    en: '',
    cn: '',
  }, // hanya Indonesia
  bio: {
    id: '',
    en: '',
    cn: '',
  }, // hanya Indonesia
  imageUrl: '',
  linkedinUrl: '',
};

const TeamManagementView: React.FC<TeamManagementViewProps> = ({ showToast }) => {
  const { t } = useTranslations();

  // Data daftar anggota tim dari API
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  // Data anggota tim yang sedang diedit (kalau null = mode tambah)
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  // Data form anggota tim (bind ke input)
  const [teamFormData, setTeamFormData] = useState<Omit<TeamMember, 'id'>>(emptyTeamMember);

  // Error validasi form per field
  const [teamFormErrors, setTeamFormErrors] = useState<{
    [key: string]: string;
  }>({});

  // ID anggota tim yang akan dihapus (untuk modal konfirmasi)
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  // Flag loading saat simpan (create / update)
  const [isSaving, setIsSaving] = useState(false);
  // Flag loading saat mengambil daftar anggota tim
  const [isLoadingList, setIsLoadingList] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                       Ambil data anggota tim dari API                      */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const loadTeam = async () => {
      try {
        setIsLoadingList(true);
        const data = await teamService.getTeamMembers();
        setTeamMembers(data);
      } catch (err) {
        console.error('Gagal memuat anggota tim:', err);
        const msg =
          err instanceof Error ? err.message : 'Gagal memuat data anggota tim dari server';
        showToast(msg, 'error');
      } finally {
        setIsLoadingList(false);
      }
    };

    loadTeam();
  }, [showToast]);

  /* -------------------------------------------------------------------------- */
  /*                         Helper & validasi untuk form                       */
  /* -------------------------------------------------------------------------- */

  const validateField = (name: string, value: string) => {
    let error = '';

    if (!value || value.trim() === '') {
      error = t.admin.validation.required;
    } else if (name === 'linkedinUrl' && value.trim() !== '') {
      // Validasi sederhana URL LinkedIn
      try {
        new URL(value);
      } catch (_) {
        error = t.admin.validation.url;
      }
    }

    setTeamFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleTeamFormChange = (field: string, value: any) => {
    // Normalisasi nama field (kalau format "title.id" / "bio.id" → jadi "title"/"bio")
    const fieldName = field.replace(/\.id$/, '');
    if (['name', 'title', 'linkedinUrl'].includes(fieldName)) {
      validateField(fieldName, typeof value === 'string' ? value : '');
    }

    setTeamFormData((prev) => {
      if (field === 'title.id') {
        return {
          ...prev,
          title: {
            ...prev.title,
            id: value,
          },
        };
      }
      if (field === 'bio.id') {
        return {
          ...prev,
          bio: {
            ...prev.bio,
            id: value,
          },
        };
      }

      return {
        ...prev,
        [field]: value,
      } as Omit<TeamMember, 'id'>;
    });
  };

  const resetTeamForm = () => {
    setEditingTeamMember(null);
    setTeamFormData(emptyTeamMember);
    setTeamFormErrors({});
  };

  /* -------------------------------------------------------------------------- */
  /*                          Submit form (create / update)                     */
  /* -------------------------------------------------------------------------- */

  const handleTeamFormSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validasi akhir sebelum kirim ke server
    const errors: { [key: string]: string } = {};
    if (!teamFormData.name) errors.name = t.admin.validation.required;
    if (!teamFormData.title.id) errors.title = t.admin.validation.required;
    if (teamFormData.linkedinUrl) {
      try {
        new URL(teamFormData.linkedinUrl);
      } catch (_) {
        errors.linkedinUrl = t.admin.validation.url;
      }
    }
    setTeamFormErrors(errors);
    if (Object.values(errors).some((e) => e)) return;

    setIsSaving(true);
    try {
      if (editingTeamMember) {
        // Mode edit → update anggota tim yang sudah ada
        const updated = await teamService.updateTeamMember({
          ...editingTeamMember,
          ...teamFormData,
        });
        setTeamMembers((prev) =>
          prev.map((member) => (member.id === updated.id ? updated : member)),
        );
        showToast(t.admin.toast.memberUpdated);
      } else {
        // Mode tambah → create anggota tim baru
        const created = await teamService.addTeamMember(teamFormData);
        setTeamMembers((prev) => [created, ...prev]);
        showToast(t.admin.toast.memberCreated);
      }

      resetTeamForm();
    } catch (err) {
      console.error('Gagal menyimpan anggota tim:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan data anggota tim ke server';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                          Edit & hapus anggota tim                          */
  /* -------------------------------------------------------------------------- */

  const handleEditTeamMember = (member: TeamMember) => {
    setEditingTeamMember(member);
    setTeamFormData({
      name: member.name,
      title: member.title, // sekarang hanya { id }
      bio: member.bio, // sekarang hanya { id }
      imageUrl: member.imageUrl,
      linkedinUrl: member.linkedinUrl || '',
    });
    setTeamFormErrors({});
    window.scrollTo(0, 0);
  };

  const confirmDeleteTeamMember = async () => {
    if (!teamToDelete) return;

    try {
      await teamService.deleteTeamMember(teamToDelete);
      setTeamMembers((prev) => prev.filter((member) => member.id !== teamToDelete));
      if (editingTeamMember?.id === teamToDelete) resetTeamForm();
      showToast(t.admin.toast.memberDeleted ?? 'Anggota tim dihapus');
    } catch (err) {
      console.error('Gagal menghapus anggota tim:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menghapus data anggota tim di server';
      showToast(msg, 'error');
    } finally {
      setTeamToDelete(null);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                        State turunan: validasi form                        */
  /* -------------------------------------------------------------------------- */

  const isTeamFormValid = useMemo(() => {
    return (
      Object.values(teamFormErrors).every((error) => !error) &&
      teamFormData.name &&
      teamFormData.title.id
    );
  }, [teamFormErrors, teamFormData.name, teamFormData.title.id]);

  /* -------------------------------------------------------------------------- */
  /*                                  Render UI                                 */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      <ConfirmationModal
        isOpen={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        onConfirm={confirmDeleteTeamMember}
        title={t.admin.deleteModalTitle}
        message={t.admin.confirmDeleteMember}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
        {/* Form Anggota Tim */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-viniela-dark border-b pb-4">
            {editingTeamMember ? t.admin.editMember : t.admin.formTitleTeam}
          </h2>
          <form onSubmit={handleTeamFormSubmit} className="space-y-5">
            {/* Nama */}
            <div>
              <label className="form-label">{t.admin.nameLabel}</label>
              <input
                type="text"
                value={teamFormData.name}
                onChange={(e) => handleTeamFormChange('name', e.target.value)}
                className={`form-input ${teamFormErrors.name ? 'border-red-500' : ''}`}
                placeholder={t.admin.namePlaceholder}
              />
              {teamFormErrors.name && <p className="form-error">{teamFormErrors.name}</p>}
            </div>

            {/* Jabatan / Title (1 bahasa) */}
            <div>
              <label className="form-label">{t.admin.jobTitle}</label>
              <input
                type="text"
                value={teamFormData.title.id}
                onChange={(e) => handleTeamFormChange('title.id', e.target.value)}
                className="form-input"
                placeholder={t.admin.titleIdPlaceholder}
              />
              {teamFormErrors.title && <p className="form-error">{teamFormErrors.title}</p>}
            </div>

            {/* Bio (1 bahasa) */}
            <div>
              <label className="form-label">{t.admin.bioLabel}</label>
              <textarea
                value={teamFormData.bio.id}
                onChange={(e) => handleTeamFormChange('bio.id', e.target.value)}
                className="form-input h-24"
                placeholder={t.admin.bioIdPlaceholder}
              />
            </div>

            {/* Gambar / Foto */}
            <div>
              <label className="form-label">{t.admin.imageLabel}</label>
              <ImageUploader
                value={teamFormData.imageUrl}
                onChange={(val) => handleTeamFormChange('imageUrl', val)}
              />
            </div>

            {/* URL LinkedIn (opsional) */}
            <div>
              <label className="form-label">
                {t.admin.linkedinUrlLabel}{' '}
                <span className="text-gray-400 text-xs">{t.admin.optional}</span>
              </label>
              <input
                type="url"
                value={teamFormData.linkedinUrl}
                onChange={(e) => handleTeamFormChange('linkedinUrl', e.target.value)}
                className={`form-input ${teamFormErrors.linkedinUrl ? 'border-red-500' : ''}`}
                placeholder={t.admin.linkedinUrlPlaceholder}
              />
              {teamFormErrors.linkedinUrl && (
                <p className="form-error">{teamFormErrors.linkedinUrl}</p>
              )}
            </div>

            {/* Tombol aksi form */}
            <div className="flex justify-end items-center space-x-3 pt-4">
              {editingTeamMember && (
                <button type="button" onClick={resetTeamForm} className="btn-secondary">
                  {t.admin.cancelButton}
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={isSaving || !isTeamFormValid}>
                {isSaving && <i className="fa-solid fa-spinner fa-spin w-5 h-5 mr-2" />}
                {isSaving
                  ? t.admin.savingButton
                  : editingTeamMember
                  ? t.admin.updateMemberButton
                  : t.admin.createMemberButton}
              </button>
            </div>
          </form>
        </div>

        {/* Daftar Anggota Tim */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-viniela-dark border-b pb-3">
              {t.admin.currentMembers}
            </h2>
            {isLoadingList ? (
              <p className="text-center text-viniela-gray py-8">
                {t.admin.loading || 'Memuat data anggota tim...'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-viniela-silver/50 p-4 rounded-lg flex items-center gap-4"
                    >
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div className="flex-grow min-w-0">
                        <h3 className="font-bold text-viniela-dark truncate">{member.name}</h3>
                        <p className="text-xs text-viniela-gray truncate">{member.title.id}</p>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleEditTeamMember(member)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-100 px-2 py-1 rounded"
                          >
                            {t.admin.edit}
                          </button>
                          <button
                            onClick={() => setTeamToDelete(member.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-100 px-2 py-1 rounded"
                          >
                            {t.admin.delete}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-2 text-center text-viniela-gray py-8">
                    {t.admin.noTeamMembers}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamManagementView;
