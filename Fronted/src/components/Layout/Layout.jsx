import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';

const Layout = () => {
  return (
    <div className="d-flex flex-column min-vh-100 layout-wrapper">
      <Navbar />
      <main className="flex-grow-1 layout-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
