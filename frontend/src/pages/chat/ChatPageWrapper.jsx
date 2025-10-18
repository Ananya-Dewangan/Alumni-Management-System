// ChatPageWrapper.jsx
import { useParams, useNavigate } from "react-router-dom";
import ChatPage from "./ChatPage";

export default function ChatPageWrapper() {
  const { alumniId } = useParams();
  const navigate = useNavigate();
  return <ChatPage userId={userId} onBack={() => navigate(-1)} />;
}
