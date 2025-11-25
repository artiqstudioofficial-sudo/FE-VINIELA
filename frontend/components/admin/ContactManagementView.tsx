import React, { useEffect, useState } from "react";

import { useTranslations } from "../../contexts/i18n";

import ConfirmationModal from "../../components/ConfirmationModal";

import * as contactService from "../../services/contactService";

import { ContactMessage } from "../../types";

type ToastFn = (message: string, type?: "success" | "error") => void;

interface ContactManagementViewProps {
  showToast: ToastFn;
}

const ContactManagementView: React.FC<ContactManagementViewProps> = ({
  showToast,
}) => {
  const { t } = useTranslations();

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
    null
  );

  useEffect(() => {
    setContactMessages(contactService.getContactMessages());
  }, []);

  const confirmDeleteMessage = () => {
    if (messageToDelete) {
      contactService.deleteContactMessage(messageToDelete);
      setContactMessages(contactService.getContactMessages());
      setMessageToDelete(null);
      showToast(t.admin.toast.messageDeleted ?? "Message deleted");
    }
  };

  return (
    <>
      <ConfirmationModal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onConfirm={confirmDeleteMessage}
        title={t.admin.deleteModalTitle}
        message={t.admin.confirmDeleteMessage}
      />

      <div className="bg-white p-8 rounded-xl shadow-lg animate-fade-in-up">
        <div className="overflow-x-auto">
          {contactMessages.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.admin.sender}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.admin.subject}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.admin.receivedOn}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contactMessages.map((msg) => (
                  <React.Fragment key={msg.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        setExpandedMessageId(
                          expandedMessageId === msg.id ? null : msg.id
                        )
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {msg.name}
                        </div>
                        <div className="text-sm text-gray-500">{msg.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {msg.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(msg.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMessageToDelete(msg.id);
                          }}
                          className="text-red-600 hover:text-red-900 transition-colors p-2 hover:bg-red-50 rounded-full"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                    {expandedMessageId === msg.id && (
                      <tr className="bg-gray-50 animate-fade-in">
                        <td colSpan={4} className="px-6 py-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white p-4 rounded border border-gray-200">
                            {msg.message}
                          </p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <i className="fa-regular fa-envelope-open fa-3x text-gray-300 mb-4"></i>
              <p className="text-gray-500">{t.admin.noMessages}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ContactManagementView;
