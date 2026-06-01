import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import LogEntry from "./pages/LogEntry";
import SharedDigest from "./pages/SharedDigest";
import WeeklyReflection from "./pages/WeeklyReflection";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log" element={<LogEntry />} />
        <Route path="/history" element={<History />} />
        <Route path="/reflection" element={<WeeklyReflection />} />
        <Route path="/shared/:token" element={<SharedDigest />} />
      </Routes>
    </Layout>
  );
}
