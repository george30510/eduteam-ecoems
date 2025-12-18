import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '@/store/examStore';

const Index = () => {
  const navigate = useNavigate();
  const isAuthenticated = useExamStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return null;
};

export default Index;
