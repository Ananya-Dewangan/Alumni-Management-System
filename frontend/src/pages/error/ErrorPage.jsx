// ErrorPage.jsx
import { Link } from "react-router-dom";
import { LinkedInHeader } from "../../components/linkedin-header";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* LinkedIn Header */}
      <LinkedInHeader />

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-blue-600">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-800">
            Page Not Found
          </h2>
          <p className="mt-2 text-gray-600">
            We can’t seem to find the page you’re looking for.  
            It might have been moved or deleted.
          </p>

          <div className="mt-6">
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full shadow-md transition"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
