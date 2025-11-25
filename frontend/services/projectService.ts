import { Project } from '../types';

export const PROJECTS_STORAGE_KEY = 'vinielaProjects';

const initialProjects: Project[] = [
  {
    id: '1',
    divisionSlug: 'viniela-interior',
    title: {
      id: 'Desain Interior Apartemen Modern',
      en: 'Modern Apartment Interior Design',
      cn: '现代公寓室内设计',
    },
    description: {
      id: 'Sebuah proyek untuk mengubah apartemen 2 kamar tidur menjadi ruang hidup yang modern, fungsional, dan elegan.',
      en: 'A project to transform a 2-bedroom apartment into a modern, functional, and elegant living space.',
      cn: '一个将两居室公寓改造成现代、实用、典雅生活空间的项目。',
    },
    imageUrl: 'https://picsum.photos/seed/interior1/800/600',
    date: '2024-05-20',
  },
  {
    id: '2',
    divisionSlug: 'viniela-design',
    title: {
      id: 'Branding untuk Startup Teknologi',
      en: 'Branding for a Tech Startup',
      cn: '科技创业公司品牌设计',
    },
    description: {
      id: 'Mengembangkan identitas visual yang lengkap, termasuk logo, palet warna, dan pedoman merek untuk klien baru di sektor teknologi.',
      en: 'Developed a complete visual identity, including a logo, color palette, and brand guidelines for a new client in the tech sector.',
      cn: '为科技领域的新客户开发了完整的视觉识别，包括标志、调色板和品牌指南。',
    },
    imageUrl: 'https://picsum.photos/seed/design1/800/600',
    date: '2024-06-10',
  },
  {
    id: '3',
    divisionSlug: 'viniela-kontraktor',
    title: {
      id: 'Pembangunan Kompleks Perumahan',
      en: 'Residential Complex Construction',
      cn: '住宅区建设',
    },
    description: {
      id: 'Manajemen proyek dari awal hingga akhir untuk pembangunan 20 unit rumah tapak modern di area sub-urban.',
      en: 'End-to-end project management for the construction of 20 modern townhouses in a suburban area.',
      cn: '郊区20套现代化联排别墅建设的端到端项目管理。',
    },
    imageUrl: 'https://picsum.photos/seed/contractor1/800/600',
    date: '2024-07-01',
  },
  {
    id: '4',
    divisionSlug: 'viniela-interior',
    title: {
        id: 'Renovasi Ruang Kantor Terbuka',
        en: 'Open-Concept Office Renovation',
        cn: '开放式办公室改造',
    },
    description: {
        id: 'Mendesain ulang ruang kantor seluas 500 meter persegi menjadi lingkungan kerja yang kolaboratif dan terbuka.',
        en: 'Redesigned a 500 square meter office space into a collaborative, open-concept working environment.',
        cn: '将500平方米的办公空间重新设计成一个协作、开放式的工作环境。',
    },
    imageUrl: 'https://picsum.photos/seed/interior2/800/600',
    date: '2024-04-15',
  }
];

export const getProjects = (): Project[] => {
  try {
    const projectsJson = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (projectsJson) {
      return JSON.parse(projectsJson);
    } else {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(initialProjects));
      return initialProjects;
    }
  } catch (error) {
    console.error('Failed to parse projects from localStorage', error);
    return initialProjects;
  }
};

export const getProjectsByDivisionSlug = (slug: string): Project[] => {
    const allProjects = getProjects();
    return allProjects.filter(project => project.divisionSlug === slug);
};

export const saveProjects = (projects: Project[]) => {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to save projects to localStorage', error);
  }
};

export const addProject = (project: Omit<Project, 'id' | 'date'>): Project => {
  const projects = getProjects();
  const newProject: Project = {
    ...project,
    id: new Date().getTime().toString(),
    date: new Date().toISOString().split('T')[0],
  };
  const updatedProjects = [newProject, ...projects];
  saveProjects(updatedProjects);
  return newProject;
};

export const updateProject = (updatedProject: Project): Project => {
  const projects = getProjects();
  const updatedProjects = projects.map(project =>
    project.id === updatedProject.id ? updatedProject : project
  );
  saveProjects(updatedProjects);
  return updatedProject;
};

export const deleteProject = (projectId: string) => {
  const projects = getProjects();
  const updatedProjects = projects.filter(project => project.id !== projectId);
  saveProjects(updatedProjects);
};