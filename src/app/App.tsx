import { useState } from "react";
import AuthPages from "./AuthPages";
import InventoryApp from "./InventoryApp";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return isAuthenticated
    ? <InventoryApp onSignOut={() => setIsAuthenticated(false)} />
    : <AuthPages onAuthenticated={() => setIsAuthenticated(true)} />;
}
