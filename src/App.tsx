import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import BlogPost from "./pages/BlogPost";
import Admin from "./pages/Admin";
import AdminNew from "./pages/AdminNew";
import RelatedSearchPage from "./pages/RelatedSearchPage";
import NotFound from "./pages/NotFound";
import PreLandingPage from "./pages/PreLandingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/blog/:categorySlug/:blogSlug" element={<BlogPost />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dataorbit" element={<AdminNew />} />
          <Route path="/related-search" element={<RelatedSearchPage />} />
          <Route path="/prelanding" element={<PreLandingPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
