import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import PropertyDetail from "@/pages/PropertyDetail";
import PropertyListings from "@/pages/PropertyListings";
import AddProperty from "@/pages/AddProperty";
import SignIn from "@/pages/SignIn"; // Unified login component
import SimpleLogin from "@/pages/SimpleLogin";
import SignUp from "@/pages/SignUp";
import SearchTest from "@/pages/SearchTest";
import AboutUs from "@/pages/AboutUs";
import Contact from "@/pages/Contact";
import Neighborhoods from "@/pages/Neighborhoods";
import Mortgage from "@/pages/Mortgage";
import Blog from "@/pages/Blog";
import Profile from "@/pages/Profile";
import MyProperties from "@/pages/MyProperties";
import Favorites from "@/pages/Favorites";
import Locations from "@/pages/Locations";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Careers from "@/pages/Careers";
import FAQ from "@/pages/FAQ";
import OuluData from "@/pages/OuluData";

// Admin pages and components
import AdminDashboard from "@/pages/admin";
import AdminProperties from "@/pages/admin/Properties";
import AdminUsers from "@/pages/admin/Users";
import AdminLocations from "@/pages/admin/Locations";
import AdminMessages from "@/pages/admin/Messages";
import AdminPages from "@/pages/admin/Pages";
import AdminSettings from "@/pages/admin/Settings";
import AdminLogs from "@/pages/admin/Logs";
import AdminCreateProperty from "@/pages/admin/CreateProperty";
import AdminCreateUser from "@/pages/admin/CreateUser";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { AdminProvider } from "@/contexts/AdminContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import MessagesPage from "./pages/MessagesPage";
import FindAgentsPage from "./pages/FindAgents";
import AdminNeighborhoods from "./pages/admin/AdminNeighborhoods";
import AdminBlogPosts from "./pages/admin/AdminBlogPosts"; // Import the new admin page
import BlogPostDetail from "./pages/BlogPostDetail";
import 'remixicon/fonts/remixicon.css';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/properties" component={PropertyListings} />
      <Route path="/properties/:type" component={PropertyListings} />
      <Route path="/property/:id" component={PropertyDetail} />
      <Route path="/add-property" component={AddProperty} />
      <Route path="/signin" component={SignIn} />
      <Route path="/simple-login" component={SimpleLogin} />
      <Route path="/signup" component={SignUp} />
      <Route path="/locations" component={Locations} />
      <Route path="/search-test" component={SearchTest} />
      <Route path="/about" component={AboutUs} />
      <Route path="/contact" component={Contact} />
      
      <Route path="/agents" component={FindAgentsPage} />
      <Route path="/neighborhoods" component={Neighborhoods} />
      <Route path="/mortgage" component={Mortgage} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPostDetail} />
      <Route path="/profile" component={Profile} />
      <Route path="/my-properties" component={MyProperties} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/oulu-data" component={OuluData} />
      <Route path="/messages" component={MessagesPage} />

      {/* Admin Routes */}
      <Route path="/admin/login" component={SimpleLogin} />
      <Route path="/admin">
        {() => <AdminRoute component={AdminDashboard} />}
      </Route>
      <Route path="/admin/dashboard">
        {() => <AdminRoute component={AdminDashboard} />}
      </Route>
      <Route path="/admin/properties">
        {() => <AdminRoute component={AdminProperties} />}
      </Route>
      <Route path="/admin/properties/create">
        {() => <AdminRoute component={AdminCreateProperty} />}
      </Route>
      <Route path="/admin/users">
        {() => <AdminRoute component={AdminUsers} />}
      </Route>
      <Route path="/admin/users/create">
        {() => <AdminRoute component={AdminCreateUser} />}
      </Route>
      <Route path="/admin/locations">
        {() => <AdminRoute component={AdminLocations} />}
      </Route>
      <Route path="/admin/messages">
        {() => <AdminRoute component={AdminMessages} />}
      </Route>
      <Route path="/admin/pages">
        {() => <AdminRoute component={AdminPages} />}
      </Route>
      <Route path="/admin/settings">
        {() => <AdminRoute component={AdminSettings} />}
      </Route>
      <Route path="/admin/logs">
        {() => <AdminRoute component={AdminLogs} />}
      </Route>
      <Route path="/admin/neighborhoods">
        {() => <AdminRoute component={AdminNeighborhoods} />}
      </Route>
      <Route path="/admin/blog">
        {() => <AdminRoute component={AdminBlogPosts} />}
      </Route>
      
      {/* Legal & Information Pages */}
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/careers" component={Careers} />
      <Route path="/faq" component={FAQ} />
      
      {/* Catch-all route for 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <AdminProvider>
          <Router />
          <Toaster />
        </AdminProvider>
      </AuthProvider>
    </SiteSettingsProvider>
  );
}

export default App;