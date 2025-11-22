import { Partner } from '../types';

export const PARTNERS_STORAGE_KEY = 'vinielaPartners';

// Using placeholder images for initial data
const initialPartners: Partner[] = [
  {
    id: '1',
    name: 'Apex Innovations',
    logoUrl: 'https://via.placeholder.com/150x50/F0F2F5/4D4D4D?text=APEX',
  },
  {
    id: '2',
    name: 'Quantum Solutions',
    logoUrl: 'https://via.placeholder.com/150x50/F0F2F5/4D4D4D?text=Quantum',
  },
  {
    id: '3',
    name: 'Nexus Corp',
    logoUrl: 'https://via.placeholder.com/150x50/F0F2F5/4D4D4D?text=NEXUS',
  },
  {
    id: '4',
    name: 'Innovate Hub',
    logoUrl: 'https://via.placeholder.com/150x50/F0F2F5/4D4D4D?text=Innovate',
  },
  {
    id: '5',
    name: 'Stellar Group',
    logoUrl: 'https://via.placeholder.com/150x50/F0F2F5/4D4D4D?text=Stellar',
  },
  {
    id: '6',
    name: 'Orbit Enterprises',
    logoUrl: 'https://via.placeholder.com/150x50/F0F2F5/4D4D4D?text=Orbit',
  },
];

export const getPartners = (): Partner[] => {
  try {
    const partnersJson = localStorage.getItem(PARTNERS_STORAGE_KEY);
    if (partnersJson) {
      return JSON.parse(partnersJson);
    } else {
      localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(initialPartners));
      return initialPartners;
    }
  } catch (error) {
    console.error('Failed to parse partners from localStorage', error);
    return initialPartners;
  }
};

export const savePartners = (partners: Partner[]) => {
  try {
    localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(partners));
  } catch (error) {
    console.error('Failed to save partners to localStorage', error);
  }
};

export const addPartner = (partner: Omit<Partner, 'id'>): Partner => {
  const partners = getPartners();
  const newPartner: Partner = {
    ...partner,
    id: new Date().getTime().toString(),
  };
  const updatedPartners = [newPartner, ...partners];
  savePartners(updatedPartners);
  return newPartner;
};

export const updatePartner = (updatedPartner: Partner): Partner => {
  const partners = getPartners();
  const updatedPartners = partners.map(partner =>
    partner.id === updatedPartner.id ? updatedPartner : partner
  );
  savePartners(updatedPartners);
  return updatedPartner;
};

export const deletePartner = (partnerId: string) => {
  const partners = getPartners();
  const updatedPartners = partners.filter(partner => partner.id !== partnerId);
  savePartners(updatedPartners);
};
