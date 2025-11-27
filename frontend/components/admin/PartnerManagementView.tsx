import React, { FormEvent, useEffect, useMemo, useState } from 'react';

import { useTranslations } from '../../contexts/i18n';

import ConfirmationModal from '../../components/ConfirmationModal';
import ImageUploader from '../../components/ImageUploader';

import * as partnerService from '../../services/partnerService';

import { Partner } from '../../types';

type ToastFn = (message: string, type?: 'success' | 'error') => void;

interface PartnerManagementViewProps {
  showToast: ToastFn;
}

const emptyPartner: Omit<Partner, 'id'> = {
  name: '',
  logoUrl: '',
};

const PartnerManagementView: React.FC<PartnerManagementViewProps> = ({ showToast }) => {
  const { t } = useTranslations();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerFormData, setPartnerFormData] = useState<Omit<Partner, 'id'>>(emptyPartner);

  const [partnerFormErrors, setPartnerFormErrors] = useState<{
    [key: string]: string;
  }>({});

  const [partnerToDelete, setPartnerToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  /* ----------------------------- Load dari API ----------------------------- */

  useEffect(() => {
    const loadPartners = async () => {
      try {
        setIsLoadingList(true);
        const data = await partnerService.getPartners();
        setPartners(data);
      } catch (err) {
        console.error('Gagal memuat partners:', err);
        const msg = err instanceof Error ? err.message : 'Gagal memuat data partner dari server';
        showToast(msg, 'error');
      } finally {
        setIsLoadingList(false);
      }
    };

    loadPartners();
  }, [showToast]);

  /* -------------------------- Form helpers/validation ---------------------- */

  const validateField = (name: string, value: string) => {
    let error = '';
    if (!value || value.trim() === '') {
      error = t.admin.validation.required;
    }
    setPartnerFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handlePartnerFormChange = (field: string, value: string) => {
    validateField(field, value);
    setPartnerFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetPartnerForm = () => {
    setEditingPartner(null);
    setPartnerFormData(emptyPartner);
    setPartnerFormErrors({});
  };

  /* ------------------------------ Submit form ------------------------------ */

  const handlePartnerFormSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};
    if (!partnerFormData.name) errors.name = t.admin.validation.required;
    if (!partnerFormData.logoUrl) errors.logoUrl = t.admin.validation.required;
    setPartnerFormErrors(errors);
    if (Object.values(errors).some((e) => e)) return;

    setIsSaving(true);
    try {
      if (editingPartner) {
        // update existing partner
        const updated = await partnerService.updatePartner({
          ...editingPartner,
          ...partnerFormData,
        });
        setPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast(t.admin.toast.partnerUpdated);
      } else {
        // create new partner
        const created = await partnerService.addPartner(partnerFormData);
        setPartners((prev) => [created, ...prev]);
        showToast(t.admin.toast.partnerCreated);
      }

      resetPartnerForm();
    } catch (err) {
      console.error('Gagal menyimpan partner:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan data partner ke server';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------------------- Edit / Delete ------------------------------ */

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setPartnerFormData({
      name: partner.name,
      logoUrl: partner.logoUrl,
    });
    setPartnerFormErrors({});
    window.scrollTo(0, 0);
  };

  const confirmDeletePartner = async () => {
    if (!partnerToDelete) return;

    try {
      await partnerService.deletePartner(partnerToDelete);
      setPartners((prev) => prev.filter((partner) => partner.id !== partnerToDelete));
      if (editingPartner?.id === partnerToDelete) resetPartnerForm();
      setPartnerToDelete(null);
      showToast(t.admin.toast.partnerDeleted ?? 'Partner deleted');
    } catch (err) {
      console.error('Gagal menghapus partner:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menghapus partner di server';
      showToast(msg, 'error');
    } finally {
      setPartnerToDelete(null);
    }
  };

  /* ------------------------------ Derived state ---------------------------- */

  const isPartnerFormValid = useMemo(() => {
    return (
      Object.values(partnerFormErrors).every((error) => !error) &&
      partnerFormData.name &&
      partnerFormData.logoUrl
    );
  }, [partnerFormErrors, partnerFormData.name, partnerFormData.logoUrl]);

  /* --------------------------------- Render -------------------------------- */

  return (
    <>
      <ConfirmationModal
        isOpen={!!partnerToDelete}
        onClose={() => setPartnerToDelete(null)}
        onConfirm={confirmDeletePartner}
        title={t.admin.deleteModalTitle}
        message={t.admin.confirmDeletePartner}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
        {/* Form Partner */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-viniela-dark border-b pb-4">
            {editingPartner ? t.admin.editPartner : t.admin.formTitlePartners}
          </h2>
          <form onSubmit={handlePartnerFormSubmit} className="space-y-5">
            <div>
              <label className="form-label">{t.admin.partnerNameLabel}</label>
              <input
                type="text"
                value={partnerFormData.name}
                onChange={(e) => handlePartnerFormChange('name', e.target.value)}
                className={`form-input ${partnerFormErrors.name ? 'border-red-500' : ''}`}
                placeholder={t.admin.partnerNamePlaceholder}
              />
              {partnerFormErrors.name && <p className="form-error">{partnerFormErrors.name}</p>}
            </div>

            <div>
              <label className="form-label">{t.admin.logoLabel}</label>
              <ImageUploader
                value={partnerFormData.logoUrl}
                onChange={(val) => handlePartnerFormChange('logoUrl', val)}
              />
              {partnerFormErrors.logoUrl && (
                <p className="form-error">{partnerFormErrors.logoUrl}</p>
              )}
            </div>

            <div className="flex justify-end items-center space-x-3 pt-4">
              {editingPartner && (
                <button type="button" onClick={resetPartnerForm} className="btn-secondary">
                  {t.admin.cancelButton}
                </button>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving || !isPartnerFormValid}
              >
                {isSaving && <i className="fa-solid fa-spinner fa-spin w-5 h-5 mr-2" />}
                {isSaving
                  ? t.admin.savingButton
                  : editingPartner
                  ? t.admin.updatePartnerButton
                  : t.admin.createPartnerButton}
              </button>
            </div>
          </form>
        </div>

        {/* List Partner */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-viniela-dark border-b pb-3">
              {t.admin.currentPartners}
            </h2>

            {isLoadingList ? (
              <p className="col-span-full text-center text-viniela-gray py-8">
                {t.admin.loading || 'Memuat data partner...'}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {partners.length > 0 ? (
                  partners.map((partner) => (
                    <div
                      key={partner.id}
                      className="bg-viniela-silver/50 p-4 rounded-lg flex flex-col items-center relative group"
                    >
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="h-12 object-contain mb-2"
                      />
                      <p className="text-xs text-center font-medium text-viniela-gray">
                        {partner.name}
                      </p>
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-2">
                        <button
                          onClick={() => handleEditPartner(partner)}
                          className="p-2 bg-white rounded-full text-blue-600 hover:text-blue-800"
                        >
                          <i className="fa-solid fa-pencil"></i>
                        </button>
                        <button
                          onClick={() => setPartnerToDelete(partner.id)}
                          className="p-2 bg-white rounded-full text-red-600 hover:text-red-800"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-center text-viniela-gray py-8">
                    {t.admin.noPartners}
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

export default PartnerManagementView;
