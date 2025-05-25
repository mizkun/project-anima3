/**
 * Project Anima Web UI メインアプリケーション
 */
import { Layout } from './components/Layout/Layout';
import { SimulationPage } from './pages/SimulationPage';

function App() {
  return (
    <Layout>
      <SimulationPage />
    </Layout>
  );
}

export default App;
