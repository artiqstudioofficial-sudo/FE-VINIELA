import React, { FormEvent, useEffect, useMemo, useState } from "react";

import { useTranslations } from "../../contexts/i18n";

import ImageUploader from "../../components/ImageUploader";
import ConfirmationModal from "../../components/ConfirmationModal";

import * as teamService from "../../services/teamService";

import { Language, TeamMember } from "../../types";
import LangTabs from "./LangTabs";

type ToastFn = (message: string, type?: "success" | "error") => void;

interface TeamManagementViewProps {
  showToast: ToastFn;
}

const emptyTeamMember: Omit<TeamMember, "id"> = {
  name: "",
  title: { id: "", en: "", cn: "" },
  bio: { id: "", en: "", cn: "" },
  imageUrl: "",
  linkedinUrl: "",
};

const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  showToast,
}) => {
  const { t } = useTranslations();

  const [activeLangTab, setActiveLangTab] = useState<Language>("id");

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(
    null
  );
  const [teamFormData, setTeamFormData] =
    useState<Omit<TeamMember, "id">>(emptyTeamMember);

  const [teamFormErrors, setTeamFormErrors] = useState<{
    [key: string]: string;
  }>({});

  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTeamMembers(teamService.getTeamMembers());
  }, []);

  const validateField = (name: string, value: string) => {
    let error = "";
    if (!value || value.trim() === "") {
      error = t.admin.validation.required;
    } else if (name === "linkedinUrl" && value.trim() !== "") {
      try {
        new URL(value);
      } catch (_) {
        error = t.admin.validation.url;
      }
    }

    setTeamFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleTeamFormChange = (field: string, value: any) => {
    const fieldName = field.replace(/\.(id|en|cn)$/, "");
    if (["name", "title", "linkedinUrl"].includes(fieldName)) {
      validateField(fieldName, typeof value === "string" ? value : "");
    }

    setTeamFormData((prev) => {
      const keys = field.split(".");
      if (keys.length === 2) {
        const [fieldKey, langKey] = keys as [keyof typeof prev, string];
        const nestedObject = prev[fieldKey] as any;
        return { ...prev, [fieldKey]: { ...nestedObject, [langKey]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const resetTeamForm = () => {
    setEditingTeamMember(null);
    setTeamFormData(emptyTeamMember);
    setTeamFormErrors({});
  };

  const handleTeamFormSubmit = (e: FormEvent) => {
    e.preventDefault();
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
    setTimeout(() => {
      if (editingTeamMember) {
        teamService.updateTeamMember({
          ...editingTeamMember,
          ...teamFormData,
        });
        showToast(t.admin.toast.memberUpdated);
      } else {
        teamService.addTeamMember(teamFormData);
        showToast(t.admin.toast.memberCreated);
      }
      setTeamMembers(teamService.getTeamMembers());
      resetTeamForm();
      setIsSaving(false);
    }, 500);
  };

  const handleEditTeamMember = (member: TeamMember) => {
    setEditingTeamMember(member);
    setTeamFormData({
      name: member.name,
      title: member.title,
      bio: member.bio,
      imageUrl: member.imageUrl,
      linkedinUrl: member.linkedinUrl || "",
    });
    setTeamFormErrors({});
    window.scrollTo(0, 0);
  };

  const confirmDeleteTeamMember = () => {
    if (teamToDelete) {
      teamService.deleteTeamMember(teamToDelete);
      setTeamMembers(teamService.getTeamMembers());
      if (editingTeamMember?.id === teamToDelete) resetTeamForm();
      setTeamToDelete(null);
      showToast(t.admin.toast.memberDeleted ?? "Member deleted");
    }
  };

  const isTeamFormValid = useMemo(() => {
    return (
      Object.values(teamFormErrors).every((error) => !error) &&
      teamFormData.name &&
      teamFormData.title.id
    );
  }, [teamFormErrors, teamFormData.name, teamFormData.title.id]);

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
        {/* Form Team */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-viniela-dark border-b pb-4">
            {editingTeamMember ? t.admin.editMember : t.admin.formTitleTeam}
          </h2>
          <form onSubmit={handleTeamFormSubmit} className="space-y-5">
            <div>
              <label className="form-label">{t.admin.nameLabel}</label>
              <input
                type="text"
                value={teamFormData.name}
                onChange={(e) => handleTeamFormChange("name", e.target.value)}
                className={`form-input ${
                  teamFormErrors.name ? "border-red-500" : ""
                }`}
                placeholder={t.admin.namePlaceholder}
              />
              {teamFormErrors.name && (
                <p className="form-error">{teamFormErrors.name}</p>
              )}
            </div>

            <div>
              <label className="form-label">{t.admin.jobTitle}</label>
              <LangTabs
                activeLang={activeLangTab}
                onChange={setActiveLangTab}
              />
              {activeLangTab === "id" && (
                <input
                  type="text"
                  value={teamFormData.title.id}
                  onChange={(e) =>
                    handleTeamFormChange("title.id", e.target.value)
                  }
                  className="form-input"
                  placeholder={t.admin.titleIdPlaceholder}
                />
              )}
              {activeLangTab === "en" && (
                <input
                  type="text"
                  value={teamFormData.title.en}
                  onChange={(e) =>
                    handleTeamFormChange("title.en", e.target.value)
                  }
                  className="form-input"
                  placeholder={t.admin.titleEnPlaceholder}
                />
              )}
              {activeLangTab === "cn" && (
                <input
                  type="text"
                  value={teamFormData.title.cn}
                  onChange={(e) =>
                    handleTeamFormChange("title.cn", e.target.value)
                  }
                  className="form-input"
                  placeholder={t.admin.titleCnPlaceholder}
                />
              )}
              {teamFormErrors.title && (
                <p className="form-error">{teamFormErrors.title}</p>
              )}
            </div>

            <div>
              <label className="form-label">{t.admin.bioLabel}</label>
              <LangTabs
                activeLang={activeLangTab}
                onChange={setActiveLangTab}
              />
              {activeLangTab === "id" && (
                <textarea
                  value={teamFormData.bio.id}
                  onChange={(e) =>
                    handleTeamFormChange("bio.id", e.target.value)
                  }
                  className="form-input h-24"
                  placeholder={t.admin.bioIdPlaceholder}
                />
              )}
              {activeLangTab === "en" && (
                <textarea
                  value={teamFormData.bio.en}
                  onChange={(e) =>
                    handleTeamFormChange("bio.en", e.target.value)
                  }
                  className="form-input h-24"
                  placeholder={t.admin.bioEnPlaceholder}
                />
              )}
              {activeLangTab === "cn" && (
                <textarea
                  value={teamFormData.bio.cn}
                  onChange={(e) =>
                    handleTeamFormChange("bio.cn", e.target.value)
                  }
                  className="form-input h-24"
                  placeholder={t.admin.bioCnPlaceholder}
                />
              )}
            </div>

            <div>
              <label className="form-label">{t.admin.imageLabel}</label>
              <ImageUploader
                value={teamFormData.imageUrl}
                onChange={(val) => handleTeamFormChange("imageUrl", val)}
              />
            </div>

            <div>
              <label className="form-label">
                {t.admin.linkedinUrlLabel}{" "}
                <span className="text-gray-400 text-xs">
                  {t.admin.optional}
                </span>
              </label>
              <input
                type="url"
                value={teamFormData.linkedinUrl}
                onChange={(e) =>
                  handleTeamFormChange("linkedinUrl", e.target.value)
                }
                className={`form-input ${
                  teamFormErrors.linkedinUrl ? "border-red-500" : ""
                }`}
                placeholder={t.admin.linkedinUrlPlaceholder}
              />
              {teamFormErrors.linkedinUrl && (
                <p className="form-error">{teamFormErrors.linkedinUrl}</p>
              )}
            </div>

            <div className="flex justify-end items-center space-x-3 pt-4">
              {editingTeamMember && (
                <button
                  type="button"
                  onClick={resetTeamForm}
                  className="btn-secondary"
                >
                  {t.admin.cancelButton}
                </button>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving || !isTeamFormValid}
              >
                {isSaving && (
                  <i className="fa-solid fa-spinner fa-spin w-5 h-5 mr-2" />
                )}
                {isSaving
                  ? t.admin.savingButton
                  : editingTeamMember
                  ? t.admin.updateMemberButton
                  : t.admin.createMemberButton}
              </button>
            </div>
          </form>
        </div>

        {/* List Team */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-viniela-dark border-b pb-3">
              {t.admin.currentMembers}
            </h2>
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
                      <h3 className="font-bold text-viniela-dark truncate">
                        {member.name}
                      </h3>
                      <p className="text-xs text-viniela-gray truncate">
                        {member.title.en}
                      </p>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamManagementView;
