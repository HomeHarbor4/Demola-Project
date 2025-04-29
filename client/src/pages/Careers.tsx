import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Careers() {
  const [search, setSearch] = useState("");
  
  const departments = [
    { id: "all", name: "All Teams" },
    { id: "tech", name: "Technology" },
    { id: "product", name: "Product" },
    { id: "design", name: "Design" },
    { id: "marketing", name: "Marketing" },
    { id: "sales", name: "Sales" },
    { id: "operations", name: "Operations" },
  ];
  
  const locations = [
    { id: "all", name: "All Locations" },
    { id: "berlin", name: "Berlin" },
    { id: "amsterdam", name: "Amsterdam" },
    { id: "paris", name: "Paris" },
    { id: "remote", name: "Remote" },
  ];
  
  const jobOpenings = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      department: "tech",
      location: "berlin",
      type: "Full-time",
      description: "Join our frontend team to build exceptional user experiences for our real estate platform. You'll work on responsive interfaces, interactive maps, and data visualizations.",
      requirements: [
        "5+ years of experience with modern JavaScript frameworks (React preferred)",
        "Strong TypeScript skills",
        "Experience with responsive design and cross-browser compatibility",
        "Knowledge of modern CSS, including Tailwind CSS",
        "Experience with mapping libraries like Leaflet or Google Maps API"
      ]
    },
    {
      id: 2,
      title: "Backend Developer",
      department: "tech",
      location: "berlin",
      type: "Full-time",
      description: "Develop and maintain our backend services supporting our real estate platform. You'll work on API development, database optimization, and integration with third-party services.",
      requirements: [
        "3+ years of experience in backend development",
        "Proficiency in Node.js and Express",
        "Experience with PostgreSQL and ORM libraries",
        "Understanding of RESTful API design principles",
        "Knowledge of AWS or similar cloud platforms"
      ]
    },
    {
      id: 3,
      title: "UX/UI Designer",
      department: "design",
      location: "amsterdam",
      type: "Full-time",
      description: "Create intuitive and beautiful user interfaces for our web and mobile applications. You'll collaborate with product managers and developers to deliver exceptional user experiences.",
      requirements: [
        "3+ years of experience in UX/UI design",
        "Proficiency in Figma or similar design tools",
        "Experience designing responsive web and mobile interfaces",
        "Portfolio demonstrating strong visual design skills",
        "Understanding of accessibility standards"
      ]
    },
    {
      id: 4,
      title: "Product Manager",
      department: "product",
      location: "paris",
      type: "Full-time",
      description: "Lead the development of new features and improvements for our real estate platform. You'll work closely with engineering, design, and marketing teams to deliver value to our users.",
      requirements: [
        "3+ years of experience in product management",
        "Experience with agile development methodologies",
        "Strong analytical skills and data-driven decision making",
        "Excellent communication and stakeholder management",
        "Understanding of real estate market (preferred)"
      ]
    },
    {
      id: 5,
      title: "Growth Marketing Manager",
      department: "marketing",
      location: "amsterdam",
      type: "Full-time",
      description: "Drive user acquisition and retention strategies for our platform. You'll develop and execute marketing campaigns, analyze performance data, and optimize conversion funnels.",
      requirements: [
        "3+ years of experience in digital marketing",
        "Proven track record in growth marketing",
        "Experience with SEO, SEM, and social media marketing",
        "Analytical mindset with experience in marketing analytics",
        "Strong communication and project management skills"
      ]
    },
    {
      id: 6,
      title: "DevOps Engineer",
      department: "tech",
      location: "remote",
      type: "Full-time",
      description: "Build and maintain our infrastructure and deployment pipelines. You'll work on CI/CD, monitoring, and ensuring the reliability and performance of our platform.",
      requirements: [
        "3+ years of experience in DevOps or SRE roles",
        "Experience with containerization and orchestration (Docker, Kubernetes)",
        "Knowledge of infrastructure as code (Terraform, CloudFormation)",
        "Experience with CI/CD pipelines",
        "Strong Linux administration skills"
      ]
    },
    {
      id: 7,
      title: "Account Executive",
      department: "sales",
      location: "paris",
      type: "Full-time",
      description: "Build relationships with real estate agencies and property developers to expand our listings database. You'll be responsible for client acquisition and retention.",
      requirements: [
        "3+ years of B2B sales experience",
        "Proven track record of meeting or exceeding sales targets",
        "Experience in real estate or SaaS sales (preferred)",
        "Excellent negotiation and relationship-building skills",
        "Fluent in French and English"
      ]
    },
    {
      id: 8,
      title: "Customer Success Manager",
      department: "operations",
      location: "berlin",
      type: "Full-time",
      description: "Ensure our customers get the most value from our platform. You'll onboard new clients, provide training, and work to increase customer satisfaction and retention.",
      requirements: [
        "2+ years of experience in customer success or account management",
        "Strong communication and presentation skills",
        "Problem-solving mindset and attention to detail",
        "Experience with CRM platforms",
        "Fluent in German and English"
      ]
    },
    {
      id: 9,
      title: "Data Analyst",
      department: "product",
      location: "remote",
      type: "Full-time",
      description: "Extract insights from our data to help drive business and product decisions. You'll analyze user behavior, market trends, and platform performance.",
      requirements: [
        "3+ years of experience in data analysis",
        "Proficiency in SQL and data visualization tools",
        "Experience with Python or R for data analysis",
        "Strong statistical knowledge",
        "Ability to translate data insights into actionable recommendations"
      ]
    }
  ];
  
  const [department, setDepartment] = useState("all");
  const [location, setLocation] = useState("all");
  
  // Filter job openings based on search, department, and location
  const filteredJobs = jobOpenings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                         job.description.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = department === "all" || job.department === department;
    const matchesLocation = location === "all" || job.location === location;
    
    return matchesSearch && matchesDepartment && matchesLocation;
  });
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="bg-primary-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto text-primary-100">
            Help us revolutionize how people find their perfect home in Europe
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        {/* Our Values Section */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle>Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  We embrace change and constantly seek better ways to solve real estate challenges. 
                  We encourage creative thinking and bold ideas from every team member.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle>User-Centric</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Our users are at the heart of everything we do. We're committed to understanding 
                  their needs and building solutions that exceed their expectations.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle>Integrity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  We believe in transparency, honesty, and ethical practices. We build trust 
                  with our users, partners, and each other through consistent, reliable actions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Life at HomeHarbor */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Life at HomeHarbor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Benefits & Perks</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Competitive salary and equity options
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Flexible working arrangements (hybrid or remote)
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  30 days of paid vacation per year
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Health, dental, and vision insurance
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Learning & development budget
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Wellness programs and mental health support
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Our Culture</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Collaborative environment with cross-functional teams
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Regular team events and social activities
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Diverse and inclusive workplace
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Open communication and transparent decision-making
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Recognition of achievements and contributions
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Modern offices with all the amenities you need
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Job Openings */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Open Positions</h2>
          
          {/* Search and Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Input
                  placeholder="Search positions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Tabs value={department} onValueChange={setDepartment}>
                  <TabsList className="w-full">
                    {departments.map((dept) => (
                      <TabsTrigger key={dept.id} value={dept.id} className="flex-1">
                        {dept.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                
                <Tabs value={location} onValueChange={setLocation}>
                  <TabsList className="w-full">
                    {locations.map((loc) => (
                      <TabsTrigger key={loc.id} value={loc.id} className="flex-1">
                        {loc.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
          
          {/* Job Listings */}
          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="bg-white">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {locations.find(l => l.id === job.location)?.name} · {departments.find(d => d.id === job.department)?.name} · {job.type}
                        </CardDescription>
                      </div>
                      <Button className="mt-4 md:mt-0">Apply Now</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-4">{job.description}</p>
                    <h4 className="font-medium mb-2">Requirements:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      {job.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-end">
                    <Button variant="outline">Share</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-slate-900">No positions found</h3>
              <p className="mt-1 text-slate-500">Try adjusting your search criteria or check back later for new openings.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setDepartment("all");
                  setLocation("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
        
        {/* Call-to-Action */}
        <div className="mt-16 bg-primary-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Don't see a position that fits your skills?</h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            We're always looking for talented individuals to join our team. Send us your resume and let us know how you can contribute to HomeHarbor's mission.
          </p>
          <Button>Submit Your Resume</Button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}