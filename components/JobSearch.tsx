import React, { useState } from 'react';

interface Props {
  onBack: () => void;
}

interface JobSource {
  name: string;
  category: 'MNC' | 'Startup' | 'Remote' | 'Portal' | 'Service-Based' | 'Banking' | 'Internship';
  url: string;
  description: string;
  popularFor: string;
}

// Extensive list of top career pages
const JOB_SOURCES: JobSource[] = [
  // --- TOP PORTALS ---
  { name: "LinkedIn Jobs", category: "Portal", url: "https://www.linkedin.com/jobs/", description: "The #1 professional networking platform.", popularFor: "Networking" },
  { name: "Naukri.com", category: "Portal", url: "https://www.naukri.com/", description: "India's largest job portal.", popularFor: "Indian Jobs" },
  { name: "Indeed", category: "Portal", url: "https://www.indeed.com/", description: "Global job aggregator.", popularFor: "Mass Search" },
  { name: "Glassdoor", category: "Portal", url: "https://www.glassdoor.com/Job/index.htm", description: "Jobs + Company Reviews.", popularFor: "Salary Insights" },
  { name: "Instahyre", category: "Portal", url: "https://www.instahyre.com/", description: "Premium tech hiring.", popularFor: "High Tech" },
  { name: "Hirist", category: "Portal", url: "https://www.hirist.com/", description: "Premium tech jobs in India.", popularFor: "Developers" },

  // --- MAANG & BIG TECH ---
  { name: "Google", category: "MNC", url: "https://careers.google.com/", description: "Search, Cloud, AI, Android.", popularFor: "SDE, AI, Research" },
  { name: "Microsoft", category: "MNC", url: "https://careers.microsoft.com/", description: "Windows, Azure, Office 365.", popularFor: ".NET, Cloud" },
  { name: "Amazon", category: "MNC", url: "https://www.amazon.jobs/", description: "AWS, E-commerce, Logistics.", popularFor: "SDE, Ops, Data" },
  { name: "Meta", category: "MNC", url: "https://www.metacareers.com/", description: "Facebook, Instagram, WhatsApp.", popularFor: "React, AI" },
  { name: "Apple", category: "MNC", url: "https://www.apple.com/careers/", description: "iOS, Mac, Hardware, Services.", popularFor: "Swift, Hardware" },
  { name: "Netflix", category: "MNC", url: "https://jobs.netflix.com/", description: "Streaming, high-scale engineering.", popularFor: "System Design" },
  { name: "Adobe", category: "MNC", url: "https://careers.adobe.com/", description: "Creative Cloud, PDF, Digital Exp.", popularFor: "Graphics, Web" },
  { name: "Salesforce", category: "MNC", url: "https://careers.salesforce.com/", description: "Cloud CRM giant.", popularFor: "Cloud, CRM" },
  { name: "Uber", category: "MNC", url: "https://www.uber.com/us/en/careers/", description: "Transportation & Mobility.", popularFor: "Backend, Apps" },
  { name: "Atlassian", category: "MNC", url: "https://www.atlassian.com/company/careers", description: "Jira, Trello, Confluence.", popularFor: "Java, Frontend" },

  // --- SERVICE BASED GIANTS (Mass Recruiters) ---
  { name: "TCS", category: "Service-Based", url: "https://www.tcs.com/careers", description: "Tata Consultancy Services.", popularFor: "Mass Hiring" },
  { name: "Infosys", category: "Service-Based", url: "https://www.infosys.com/careers.html", description: "Global consulting & IT.", popularFor: "Training" },
  { name: "Wipro", category: "Service-Based", url: "https://careers.wipro.com/", description: "IT, Consulting, BPO.", popularFor: "Support, Dev" },
  { name: "Accenture", category: "Service-Based", url: "https://www.accenture.com/in-en/careers", description: "Strategy & Tech consulting.", popularFor: "Consulting" },
  { name: "Cognizant", category: "Service-Based", url: "https://careers.cognizant.com/global/en", description: "IT & Healthcare tech.", popularFor: "CTS GenC" },
  { name: "Capgemini", category: "Service-Based", url: "https://www.capgemini.com/careers/", description: "French multinational IT.", popularFor: "Analyst" },
  { name: "HCL Tech", category: "Service-Based", url: "https://www.hcltech.com/careers", description: "Infrastructure & Software.", popularFor: "Support, IT" },
  { name: "Tech Mahindra", category: "Service-Based", url: "https://careers.techmahindra.com/", description: "Telecom & IT.", popularFor: "Telecom" },
  { name: "Deloitte", category: "Service-Based", url: "https://www2.deloitte.com/global/en/careers/job-search.html", description: "Big 4 Accounting & Tech.", popularFor: "Audit, Tech" },
  { name: "IBM", category: "Service-Based", url: "https://www.ibm.com/careers/us-en/", description: "Cloud, AI, Consulting.", popularFor: "Mainframe, Cloud" },

  // --- STARTUPS & HIGH GROWTH ---
  { name: "Wellfound", category: "Startup", url: "https://wellfound.com/jobs", description: "Formerly AngelList. #1 for Startups.", popularFor: "Startup Jobs" },
  { name: "Y Combinator", category: "Startup", url: "https://www.ycombinator.com/jobs", description: "Work at YC funded startups.", popularFor: "Early Stage" },
  { name: "Swiggy", category: "Startup", url: "https://careers.swiggy.com/", description: "Food delivery tech.", popularFor: "Backend, App" },
  { name: "Zomato", category: "Startup", url: "https://www.zomato.com/careers", description: "Food & Dining.", popularFor: "Product" },
  { name: "Flipkart", category: "Startup", url: "https://www.flipkartcareers.com/", description: "Walmart owned e-commerce.", popularFor: "SDE, Supply Chain" },
  { name: "Razorpay", category: "Startup", url: "https://razorpay.com/jobs/", description: "Fintech payments.", popularFor: "Golang, PHP" },
  { name: "Cred", category: "Startup", url: "https://careers.cred.club/", description: "Premium fintech.", popularFor: "Design, Backend" },
  { name: "Zerodha", category: "Startup", url: "https://zerodha.com/careers", description: "Stock broking tech.", popularFor: "FOSS, Python" },
  { name: "Zoho", category: "Startup", url: "https://www.zoho.com/careers/", description: "SaaS product suite.", popularFor: "Product Dev" },
  { name: "Freshworks", category: "Startup", url: "https://www.freshworks.com/company/careers/", description: "Customer engagement SaaS.", popularFor: "SaaS" },

  // --- BANKING & FINTECH ---
  { name: "J.P. Morgan", category: "Banking", url: "https://careers.jpmorgan.com/global/en/home", description: "Investment Banking & Tech.", popularFor: "Java, Python" },
  { name: "Goldman Sachs", category: "Banking", url: "https://www.goldmansachs.com/careers/", description: "Global Investment Banking.", popularFor: "Algorithms" },
  { name: "Morgan Stanley", category: "Banking", url: "https://www.morganstanley.com/people/opportunities", description: "Financial Services.", popularFor: "Java, C++" },
  { name: "PayPal", category: "Banking", url: "https://www.paypal.com/us/webapps/mpp/jobs", description: "Digital Payments.", popularFor: "Node, Java" },
  { name: "Mastercard", category: "Banking", url: "https://www.mastercard.us/en-us/vision/who-we-are/careers.html", description: "Global Payments.", popularFor: "Security" },

  // --- REMOTE & FREELANCE ---
  { name: "Remote.co", category: "Remote", url: "https://remote.co/remote-jobs/", description: "100% Remote jobs.", popularFor: "WFH" },
  { name: "We Work Remotely", category: "Remote", url: "https://weworkremotely.com/", description: "Largest remote community.", popularFor: "Global" },
  { name: "Toptal", category: "Remote", url: "https://www.toptal.com/", description: "Top 3% Freelancers.", popularFor: "Experts" },
  { name: "Upwork", category: "Remote", url: "https://www.upwork.com/", description: "Freelancing Marketplace.", popularFor: "Gigs" },
  { name: "Fiverr", category: "Remote", url: "https://www.fiverr.com/", description: "Micro-services.", popularFor: "Quick Tasks" },

  // --- STUDENT & INTERNSHIPS ---
  { name: "Internshala", category: "Internship", url: "https://internshala.com/", description: "India's #1 Internship portal.", popularFor: "Students" },
  { name: "Unstop (Dare2Compete)", category: "Internship", url: "https://unstop.com/", description: "Hackathons & Hiring Challenges.", popularFor: "Competitions" },
  { name: "HackerRank Jobs", category: "Internship", url: "https://www.hackerrank.com/jobs", description: "Skill based hiring.", popularFor: "Coders" },
];

const JobSearch: React.FC<Props> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "MNC", "Service-Based", "Startup", "Banking", "Remote", "Internship", "Portal"];

  const filteredJobs = JOB_SOURCES.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.popularFor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#2f8d46] flex items-center gap-2">
                <span className="text-3xl">🚀</span>
                Job Search Directory ({JOB_SOURCES.length}+)
            </h2>
            <button 
                onClick={onBack} 
                className="text-sm text-slate-500 hover:text-slate-800 font-medium"
            >
                ← Back
            </button>
        </div>
        <p className="text-slate-600">
          Curated list of <strong>{JOB_SOURCES.length}</strong> official career pages. 
          Stop searching randomly apply directly to the source.
        </p>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mt-2">
            <div className="relative flex-1">
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input
                    type="text"
                    placeholder="Search (e.g., Google, Internship, Remote)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2f8d46] focus:border-transparent outline-none"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                            selectedCategory === cat 
                            ? 'bg-[#2f8d46] text-white shadow-md' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredJobs.length > 0 ? (
            filteredJobs.map((job, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col group relative">
                <div className={`h-1.5 ${
                    job.category === 'MNC' ? 'bg-blue-600' :
                    job.category === 'Service-Based' ? 'bg-purple-600' :
                    job.category === 'Startup' ? 'bg-orange-500' :
                    job.category === 'Banking' ? 'bg-emerald-600' :
                    job.category === 'Remote' ? 'bg-cyan-500' : 
                    job.category === 'Internship' ? 'bg-yellow-500' : 'bg-slate-500'
                }`}></div>
                <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-bold border ${
                             job.category === 'MNC' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                             job.category === 'Service-Based' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                             job.category === 'Startup' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                             job.category === 'Banking' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                             job.category === 'Remote' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                             job.category === 'Internship' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-slate-50 text-slate-700 border-slate-100'
                        }`}>
                            {job.category}
                        </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1 group-hover:text-[#2f8d46] transition-colors">{job.name}</h3>
                    <p className="text-xs text-slate-400 font-medium mb-2">{job.popularFor}</p>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-snug">{job.description}</p>
                    
                    <div className="mt-auto">
                        <a 
                            href={job.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center justify-center w-full bg-slate-50 hover:bg-[#2f8d46] hover:text-white text-slate-700 border border-slate-200 hover:border-[#2f8d46] font-bold py-2 rounded transition-all text-xs"
                        >
                            Visit Career Page ↗
                        </a>
                    </div>
                </div>
            </div>
            ))
        ) : (
            <div className="col-span-full text-center py-12">
                <p className="text-slate-500 text-lg">No companies found matching "{searchTerm}".</p>
                <button 
                    onClick={() => {setSearchTerm(""); setSelectedCategory("All");}}
                    className="mt-2 text-[#2f8d46] font-bold hover:underline"
                >
                    Clear Filters
                </button>
            </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 text-center shadow-sm">
        <h3 className="text-blue-900 font-bold text-lg mb-2">💡 Pro Tip for Students</h3>
        <p className="text-blue-800 text-sm max-w-3xl mx-auto">
            <strong>ATS Tip:</strong> 70% of resumes are rejected by bots. When applying on these portals, ensure your resume keywords match the Job Description (JD). Use the <strong>"Analyze Resume"</strong> tool in this app before applying!
        </p>
      </div>
    </div>
  );
};

export default JobSearch;
