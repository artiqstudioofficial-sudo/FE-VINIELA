import React from 'react';
import { Division } from './types';

// Using a consistent set of Font Awesome icons for a clean and professional look.

const DesignIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-palette ${className}`} aria-hidden="true" />;
const InteriorIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-couch ${className}`} aria-hidden="true" />;
const ContractorIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-helmet-safety ${className}`} aria-hidden="true" />;
const HomeServiceIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-wrench ${className}`} aria-hidden="true" />;
const HomeDecorIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-chair ${className}`} aria-hidden="true" />;
const PropertyIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-building-user ${className}`} aria-hidden="true" />;
const PropertyManagementIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-tasks ${className}`} aria-hidden="true" />;
const RealEstateIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-house-chimney-window ${className}`} aria-hidden="true" />;
const LegalityIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-file-signature ${className}`} aria-hidden="true" />;
const LawyerIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-scale-balanced ${className}`} aria-hidden="true" />;
const DigitalAgencyIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-bullhorn ${className}`} aria-hidden="true" />;
const MedicalIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-heart-pulse ${className}`} aria-hidden="true" />;
const AutomotiveIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-car-side ${className}`} aria-hidden="true" />;
const CommoditiesIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-leaf ${className}`} aria-hidden="true" />;
const ConsultantIcon: React.FC<{ className?: string }> = ({ className }) => <i className={`fa-solid fa-users-gear ${className}`} aria-hidden="true" />;

export const divisions: Division[] = [
    { name: 'divisionNames.design', slug: 'viniela-design', Icon: DesignIcon, description: 'divisionDescriptions.design', url: '/divisions/viniela-design' },
    { name: 'divisionNames.interior', slug: 'viniela-interior', Icon: InteriorIcon, description: 'divisionDescriptions.interior', url: '/divisions/viniela-interior' },
    { name: 'divisionNames.contractor', slug: 'viniela-kontraktor', Icon: ContractorIcon, description: 'divisionDescriptions.contractor', url: '/divisions/viniela-kontraktor' },
    { name: 'divisionNames.homeService', slug: 'viniela-home-service', Icon: HomeServiceIcon, description: 'divisionDescriptions.homeService', url: '/divisions/viniela-home-service' },
    { name: 'divisionNames.homeDecor', slug: 'viniela-home-decor', Icon: HomeDecorIcon, description: 'divisionDescriptions.homeDecor', url: '/divisions/viniela-home-decor' },
    { name: 'divisionNames.property', slug: 'viniela-property', Icon: PropertyIcon, description: 'divisionDescriptions.property', url: '/divisions/viniela-property' },
    { name: 'divisionNames.managementProperty', slug: 'viniela-management-property', Icon: PropertyManagementIcon, description: 'divisionDescriptions.managementProperty', url: '/divisions/viniela-management-property' },
    { name: 'divisionNames.realEstate', slug: 'viniela-real-estate', Icon: RealEstateIcon, description: 'divisionDescriptions.realEstate', url: '/divisions/viniela-real-estate' },
    { name: 'divisionNames.legal', slug: 'viniela-legalitas', Icon: LegalityIcon, description: 'divisionDescriptions.legal', url: '/divisions/viniela-legalitas' },
    { name: 'divisionNames.lawyer', slug: 'viniela-pengacara', Icon: LawyerIcon, description: 'divisionDescriptions.lawyer', url: '/divisions/viniela-pengacara' },
    { name: 'divisionNames.digital', slug: 'viniela-digital-agency', Icon: DigitalAgencyIcon, description: 'divisionDescriptions.digital', url: '/divisions/viniela-digital-agency' },
    { name: 'divisionNames.medical', slug: 'viniela-medis', Icon: MedicalIcon, description: 'divisionDescriptions.medical', url: '/divisions/viniela-medis' },
    { name: 'divisionNames.automotive', slug: 'viniela-otomotif', Icon: AutomotiveIcon, description: 'divisionDescriptions.automotive', url: '/divisions/viniela-otomotif' },
    { name: 'divisionNames.commodities', slug: 'viniela-komoditas', Icon: CommoditiesIcon, description: 'divisionDescriptions.commodities', url: '/divisions/viniela-komoditas' },
    { name: 'divisionNames.consultant', slug: 'viniela-konsultan-bisnis', Icon: ConsultantIcon, description: 'divisionDescriptions.consultant', url: '/divisions/viniela-konsultan-bisnis' },
];