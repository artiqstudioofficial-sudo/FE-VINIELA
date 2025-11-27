import React, { useEffect, useState } from "react";
import { useTranslations } from "../../contexts/i18n";
import SVGPieChart, { PieChartItem } from "../charts/SVGPieChart";
import SVGBarChart, { BarChartItem } from "../charts/SVGBarChart";

import {
  listNews,
  type PaginatedNewsResponse,
} from "../../services/newsService";
import * as careersService from "../../services/careersService";
import * as contactService from "../../services/contactService";
import * as teamService from "../../services/teamService";

import {
  JobApplication,
  JobListing,
  ContactMessage,
  TeamMember,
  NewsCategory,
} from "../../types";

const newsCategories: NewsCategory[] = [
  "company",
  "division",
  "industry",
  "press",
];

const DashboardView: React.FC = () => {
  const { t } = useTranslations();

  const [newsCountByCategory, setNewsCountByCategory] = useState<
    PieChartItem[]
  >([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // === News ===
        try {
          const res: PaginatedNewsResponse = await listNews(1, 200);
          const data = res.data;

          const byCat: PieChartItem[] = newsCategories
            .map((cat) => ({
              label: t.admin.categories[cat],
              value: data.filter((n) => n.category === cat).length,
              color:
                cat === "company"
                  ? "#c09a58"
                  : cat === "division"
                  ? "#374151"
                  : cat === "industry"
                  ? "#6b7280"
                  : "#9ca3af",
            }))
            .filter((d) => d.value > 0);

          setNewsCountByCategory(byCat);
        } catch (e) {
          console.error("Failed to load dashboard news stats", e);
        }

        // === Careers (Jobs + Applications) ===
        try {
          const [jobsData, appsData] = await Promise.all([
            careersService.getJobListings(),
            careersService.getApplications(),
          ]);
          setJobs(jobsData);
          setApplications(appsData);
        } catch (e) {
          console.error("Failed to load careers data", e);
        }

        // === Contact Messages ===
        try {
          const messages = await contactService.getContactMessages();
          setContactMessages(messages);
        } catch (e) {
          console.error("Failed to load contact messages", e);
        }

        // === Team Members ===
        try {
          const members = await teamService.getTeamMembers();
          setTeamMembers(members);
        } catch (e) {
          console.error("Failed to load team members", e);
        }
      } catch (e) {
        // catch-all kalau ada error tak terduga
        console.error("Failed to load dashboard data", e);
      }
    };

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const applicationsByJob: BarChartItem[] = jobs
    .map((job) => ({
      label: job.title.id,
      value: applications.filter((app) => app.jobId === job.id).length,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const stats = [
    {
      label: t.admin.totalNews,
      value: newsCountByCategory.reduce((sum, x) => sum + x.value, 0),
      icon: "fa-newspaper",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: t.admin.totalApplications,
      value: applications.length,
      icon: "fa-file-alt",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      label: t.admin.totalMessages,
      value: contactMessages.length,
      icon: "fa-inbox",
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: t.admin.totalTeamMembers,
      value: teamMembers.length,
      icon: "fa-users",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-5 border border-gray-100"
          >
            <div
              className={`${stat.bg} ${stat.color} p-4 rounded-2xl shadow-sm`}
            >
              <i
                className={`fa-solid ${stat.icon} fa-lg w-6 h-6 flex items-center justify-center`}
              ></i>
            </div>
            <div>
              <p className="text-3xl font-bold text-viniela-dark tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full">
          <h3 className="text-lg font-bold text-viniela-dark mb-6 flex items-center gap-2">
            <i className="fa-solid fa-chart-pie text-viniela-gold"></i> News
            Distribution
          </h3>
          <div className="flex-grow flex items-center justify-center">
            <SVGPieChart data={newsCountByCategory} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full">
          <h3 className="text-lg font-bold text-viniela-dark mb-6 flex items-center gap-2">
            <i className="fa-solid fa-chart-bar text-viniela-gold"></i> Top Job
            Applications
          </h3>
          <div className="flex-grow flex items-center">
            <SVGBarChart data={applicationsByJob} color="#c09a58" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
