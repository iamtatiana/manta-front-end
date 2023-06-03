// @ts-nocheck
import GlobalContexts from 'contexts/globalContexts';
import { BridgePage, SendPage, StakePage } from 'pages';
import { CalamariBasePage, DolphinBasePage, MantaBasePage } from 'pages/BasePage';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes
} from 'react-router-dom';

const DolphinRoutes = () => {
  return (
    <DolphinBasePage>
      <Routes>
        <Route path="dolphin">
          <Route index element={<Navigate to="transact" />} />
          <Route path="bridge" element={<BridgePage />} exact />
          <Route path="transact" element={<SendPage />} exact />
        </Route>
      </Routes>
    </DolphinBasePage>
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

const MantaRoutes = () => {
  return (
    <MantaBasePage>
      <Routes>
        <Route path="manta">
          <Route index element={<Navigate to="transact" />} />
          {/* <Route path="bridge" element={<BridgePage />} exact /> */}
          <Route path="transact" element={<SendPage />} exact />
          <Route path="stake" element={<StakePage />} exact />
        </Route>
      </Routes>
    </MantaBasePage>
  );
};

const RedirectRoutes = () => {
  return (
    <Routes>
      <Route
        index
        element={<Navigate to="/manta/transact" replace />}
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
        <DolphinRoutes />
      </GlobalContexts>
    </Router>
  );
};

export default AppRouter;
