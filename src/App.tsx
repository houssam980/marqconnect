import { Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./components/home";
import AuthForm from "./components/auth/AuthForm";

function App() {
  const location = useLocation();
  
  useEffect(() => {
    console.log("App mounted");
    console.log("Current location:", location.pathname);
  }, [location]);

  return (
    <Suspense fallback={<div style={{ color: 'white', padding: '20px' }}>Loading...</div>}>
      <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
        <Routes>
          <Route path="/" element={<AuthForm />} />
          <Route path="/dashboard" element={<Home />} />
        </Routes>
      </div>
    </Suspense>
  );
}

export default App;
