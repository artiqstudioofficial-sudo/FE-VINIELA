import React, { useEffect, useState } from 'react';
import { useTranslations } from '../contexts/i18n';
import { saveContactMessage } from '../services/contactService';

const ContactPage: React.FC = () => {
  const { t } = useTranslations();
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveContactMessage({
      name: formState.name,
      email: formState.email,
      subject: formState.subject,
      message: formState.message,
    });
    setIsSubmitted(true);
  };

  return (
    <div className="bg-white animate-fade-in-up">
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center text-white bg-viniela-dark">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('https://picsum.photos/seed/contact/1920/1080')" }}
        ></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {t.contact.heroTitle}
          </h1>
          <p className="text-lg md:text-xl mt-4 max-w-3xl mx-auto">{t.contact.heroSubtitle}</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-viniela-silver">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Contact Info & Map */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-viniela-dark mb-4">{t.contact.infoTitle}</h3>
                <div className="space-y-4 text-viniela-gray">
                  <div className="flex items-start">
                    <i
                      className="fa-solid fa-location-dot w-6 h-6 mr-4 mt-1 text-viniela-gold flex-shrink-0"
                      aria-hidden="true"
                    ></i>
                    <span className="whitespace-pre-line">
                      <strong className="block text-viniela-dark">{t.contact.address}</strong>
                      {t.footer.office.address}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <i
                      className="fa-solid fa-phone w-6 h-6 mr-4 mt-1 text-viniela-gold flex-shrink-0"
                      aria-hidden="true"
                    ></i>
                    <span>
                      <strong className="block text-viniela-dark">{t.contact.phone}</strong>
                      {t.contact.phoneValue}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <i
                      className="fa-solid fa-envelope w-6 h-6 mr-4 mt-1 text-viniela-gold flex-shrink-0"
                      aria-hidden="true"
                    ></i>
                    <span>
                      <strong className="block text-viniela-dark">{t.contact.emailLabel}</strong>
                      {t.contact.emailValue}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-viniela-dark mb-4">
                  {t.contact.ourLocation}
                </h3>
                <div className="h-80 md:h-96 rounded-xl overflow-hidden shadow-md">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.741750731694!2d106.72895489999999!3d-6.1653288!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f79197e2c4fb%3A0xd797787cc64542d8!2sViniela%20Design%20Interior!5e0!3m2!1sid!2sid!4v1763443190152!5m2!1sid!2sid"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Viniela Design Interior Location"
                  ></iframe>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7 bg-white p-8 rounded-2xl shadow-lg">
              {isSubmitted ? (
                <div className="text-center flex flex-col items-center justify-center h-full">
                  <i
                    className="fa-solid fa-check-circle fa-4x text-green-500 mb-6"
                    aria-hidden="true"
                  ></i>
                  <h2 className="text-3xl font-bold text-viniela-dark">{t.contact.successTitle}</h2>
                  <p className="mt-2 text-lg text-viniela-gray">{t.contact.successMessage}</p>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-viniela-dark mb-6">
                    {t.contact.formTitle}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="name" className="form-label">
                        {t.contact.fullName}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-input"
                        value={formState.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="form-label">
                        {t.contact.email}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-input"
                        value={formState.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="form-label">
                        {t.contact.subject}
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        className="form-input"
                        value={formState.subject}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="form-label">
                        {t.contact.message}
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        className="form-input"
                        value={formState.message}
                        onChange={handleInputChange}
                        required
                      ></textarea>
                    </div>
                    <div>
                      <button type="submit" className="w-full btn-primary mt-2">
                        {t.contact.sendMessage}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      <style>{`
          .form-label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #4d4d4d; }
          .form-input { display: block; width: 100%; border-radius: 0.5rem; border: 1px solid #d1d5db; padding: 0.75rem 1rem; background-color: #f9fafb; }
          .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #c09a58; box-shadow: 0 0 0 2px #c09a58; background-color: white; }
          .btn-primary { padding: 0.75rem 1.5rem; background-color: #c09a58; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; border: none; cursor: pointer; }
          .btn-primary:hover { background-color: #b08b49; }
          @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ContactPage;
