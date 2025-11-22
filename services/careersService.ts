import { JobListing, JobApplication } from '../types';

const JOBS_STORAGE_KEY = 'vinielaJobs';
const APPLICATIONS_STORAGE_KEY = 'vinielaApplications';

const initialJobs: JobListing[] = [
    {
        id: '1',
        title: { id: 'Manajer Pemasaran Digital', en: 'Digital Marketing Manager', cn: '数字营销经理' },
        location: { id: 'Jakarta, Indonesia', en: 'Jakarta, Indonesia', cn: '雅加达, 印度尼西亚' },
        type: 'Full-time',
        description: {
            id: '<p>Kami mencari Manajer Pemasaran Digital yang bersemangat dan berpengalaman untuk bergabung dengan tim kami yang dinamis. Kandidat yang ideal akan bertanggung jawab untuk mengembangkan, mengimplementasikan, melacak, dan mengoptimalkan kampanye pemasaran digital kami di semua saluran digital untuk meningkatkan kesadaran merek, mendorong lalu lintas web, dan memperoleh prospek/pelanggan.</p>',
            en: '<p>We are looking for a passionate and experienced Digital Marketing Manager to join our dynamic team. The ideal candidate will be responsible for developing, implementing, tracking, and optimizing our digital marketing campaigns across all digital channels to enhance our brand awareness, drive web traffic, and acquire leads/customers.</p>',
            cn: '<p>我们正在寻找一位充满激情且经验丰富的数字营销经理加入我们充满活力的团队。理想的候选人将负责开发、实施、跟踪和优化我们在所有数字渠道的数字营销活动，以提高我们的品牌知名度、增加网站流量并获取潜在客户/顾客。</p>'
        },
        responsibilities: {
            id: '<ul><li>Merencanakan dan melaksanakan semua strategi pemasaran digital, termasuk SEO/SEM, email, media sosial, dan kampanye iklan bergambar.</li><li>Mengukur dan melaporkan kinerja semua kampanye pemasaran digital terhadap tujuan (ROI dan KPI).</li><li>Mengidentifikasi tren dan wawasan, dan mengoptimalkan pengeluaran dan kinerja berdasarkan wawasan tersebut.</li><li>Menyusun strategi pertumbuhan baru yang kreatif.</li></ul>',
            en: '<ul><li>Plan and execute all digital marketing strategies, including SEO/SEM, email, social media, and display advertising campaigns.</li><li>Measure and report performance of all digital marketing campaigns against goals (ROI and KPIs).</li><li>Identify trends and insights, and optimize spend and performance based on the insights.</li><li>Brainstorm new and creative growth strategies.</li></ul>',
            cn: '<ul><li>策划和执行所有数字营销策略，包括SEO/SEM、电子邮件、社交媒体和展示广告活动。</li><li>根据目标（ROI和KPI）衡量并报告所有数字营销活动的绩效。</li><li>识别趋势和见解，并根据见解优化支出和绩效。</li><li>构思新的和创造性的增长策略。</li></ul>'
        },
        qualifications: {
            id: '<ol><li>Gelar Sarjana atau Magister dalam pemasaran atau bidang terkait.</li><li>Pengalaman kerja yang terbukti dalam pemasaran digital, khususnya di industri B2B.</li><li>Keterampilan analitis yang kuat dan pemikiran berbasis data.</li><li>Memiliki pengetahuan tentang alat analisis situs web (misalnya, Google Analytics).</li></ol>',
            en: '<ol><li>BS/MS degree in marketing or a related field.</li><li>Proven working experience in digital marketing, particularly within the B2B industry.</li><li>Strong analytical skills and data-driven thinking.</li><li>Working knowledge of website analytics tools (e.g., Google Analytics).</li></ol>',
            cn: '<ol><li>市场营销或相关领域的学士/硕士学位。</li><li>具有数字营销方面的可靠工作经验，尤其是在B2B行业。</li><li>强大的分析能力和数据驱动思维。</li><li>熟悉网站分析工具（例如，Google Analytics）。</li></ol>'
        },
        date: '2024-07-20'
    }
];

// --- Job Listings ---

export const getJobListings = (): JobListing[] => {
    try {
        const jobsJson = localStorage.getItem(JOBS_STORAGE_KEY);
        if (jobsJson) {
            return JSON.parse(jobsJson);
        } else {
            localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(initialJobs));
            return initialJobs;
        }
    } catch (error) {
        console.error('Failed to parse jobs from localStorage', error);
        return initialJobs;
    }
};

export const getJobListingById = (id: string): JobListing | undefined => {
    return getJobListings().find(job => job.id === id);
};

export const saveJobListings = (jobs: JobListing[]) => {
    try {
        localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    } catch (error) {
        console.error('Failed to save jobs to localStorage', error);
    }
};

export const addJobListing = (job: Omit<JobListing, 'id' | 'date'>): JobListing => {
    const jobs = getJobListings();
    const newJob: JobListing = {
        ...job,
        id: new Date().getTime().toString(),
        date: new Date().toISOString().split('T')[0],
    };
    const updatedJobs = [newJob, ...jobs];
    saveJobListings(updatedJobs);
    return newJob;
};

export const updateJobListing = (updatedJob: JobListing): JobListing => {
    const jobs = getJobListings();
    const updatedJobs = jobs.map(job => (job.id === updatedJob.id ? updatedJob : job));
    saveJobListings(updatedJobs);
    return updatedJob;
};

export const deleteJobListing = (jobId: string) => {
    const jobs = getJobListings();
    const updatedJobs = jobs.filter(job => job.id !== jobId);
    saveJobListings(updatedJobs);
};


// --- Job Applications ---

export const getApplications = (): JobApplication[] => {
    try {
        const applicationsJson = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
        return applicationsJson ? JSON.parse(applicationsJson) : [];
    } catch (error) {
        console.error('Failed to parse applications from localStorage', error);
        return [];
    }
};

export const saveApplications = (applications: JobApplication[]) => {
    try {
        localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
    } catch (error) {
        console.error('Failed to save applications to localStorage', error);
    }
};

export const addApplication = (application: Omit<JobApplication, 'id' | 'date'>): JobApplication => {
    const applications = getApplications();
    const newApplication: JobApplication = {
        ...application,
        id: new Date().getTime().toString(),
        date: new Date().toISOString(),
    };
    const updatedApplications = [newApplication, ...applications];
    saveApplications(updatedApplications);
    return newApplication;
};

export const deleteApplication = (applicationId: string) => {
    const applications = getApplications();
    const updatedApplications = applications.filter(app => app.id !== applicationId);
    saveApplications(updatedApplications);
};