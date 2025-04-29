import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutUs() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ content: string }>("GET", "/admin/page-content/about")
      .then((res) => {
        setContent(res.content || "");
        setError(null);
      })
      .catch((err) => {
        setError("Failed to load About Us page.");
        setContent("");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          {loading && <div className="text-center py-12">Loading...</div>}
          {error && <div className="text-center text-red-500 py-12">{error}</div>}
          {!loading && !error && content && (
            <div className="prose mx-auto" dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}