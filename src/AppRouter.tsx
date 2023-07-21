// @ts-nocheck
import GlobalContexts from 'contexts/globalContexts';
import { BridgePage, SendPage, StakePage } from 'pages';
import { CalamariBasePage, MantaBasePage } from 'pages/BasePage';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes
} from 'react-router-dom';

const MantaRoutes = () => {
  return (
    <MantaBasePage>
      <Routes>
        <Route path="manta">
          <Route index element={<Navigate to="transact" />} />
          <Route path="bridge" element={<BridgePage />} exact />
          <Route path="transact" element={<SendPage />} exact />
          <Route path="stake" element={<StakePage />} exact />
        </Route>
      </Routes>
    </MantaBasePage>
  );
};

const CalamariRoutes = () => {
  return (
    <CalamariBasePage>
      <Routes>
        <Route path="calamari">
          <Route index element={<Navigate to="transact" />} />
          <Route path="bridge" element={<BridgePage />} exact />
          <Route path="transact" element={<SendPage />} exact />
          <Route path="stake" element={<StakePage />} exact />
        </Route>
      </Routes>
    </CalamariBasePage>
  );
};

const RedirectRoutes = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="/manta/transact" replace />} exact />
      <Route
        path="/stake"
        element={<Navigate to="/manta/stake" replace />}
        exact
      />
    </Routes>
  );
};

const AppRouter = () => {
  return (
    <Router>
      <GlobalContexts>
        <RedirectRoutes />
        <MantaRoutes />
        <CalamariRoutes />
      </GlobalContexts>
    </Router>
  );
};

export default AppRouter;
