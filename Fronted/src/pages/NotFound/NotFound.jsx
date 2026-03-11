import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <Container className="py-5 text-center">
      <h1 className="display-1 fw-bold">404</h1>
      <h2 className="mb-4">Page Not Found</h2>
      <p className="text-muted mb-4">
        The page you're looking for doesn't exist.
      </p>
      <Button as={Link} to="/" variant="primary" size="lg">
        Go Home
      </Button>
    </Container>
  );
};

export default NotFound;
