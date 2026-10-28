import "./App.css";
import ServiceCard from "./components/ServiceCard";
import ChatPanel from "./components/ChatPanel";

function App() {
  return (
    <div className="container">
      <header className="header">
        <h1> GovernmentGuide AI</h1>
        <p>Your Smart Government Service Assistant</p>
      </header>

      <div className="layout">
        <div>
          <h2 className="service-title">Popular Services</h2>

          <div className="service-grid">
            <ServiceCard
              icon="📘"
              title="Passport"
              description="Apply, renew or replace a passport"
            />

            <ServiceCard
              icon="💼"
              title="Employment Insurance"
              description="Benefits and EI Claims"
            />

            <ServiceCard
              icon="🏥"
              title="Health Card"
              description="Healthcare card services"
            />

            <ServiceCard
              icon="🪪"
              title="SIN Number"
              description="Apply for a Social Insurance Number"
            />
          </div>
        </div>

        <ChatPanel />
      </div>
    </div>
  );
}

export default App;