import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { ArrowRight, Lock } from 'lucide-react';

export const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-6 md:px-12 bg-gradient-to-r from-navy via-navy/95 to-primary-dark text-white text-center relative overflow-hidden">
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-6 relative z-10">
        <motion.h2
          whileInView={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl font-extrabold text-white tracking-tight"
        >
          Ready to Experience PeoplePay360?
        </motion.h2>

        <p className="text-sm md:text-base text-gray-300 max-w-xl">
          Sign in with pre-seeded demo accounts or connect directly to your shared Supabase PostgreSQL instance.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <Button variant="primary" size="lg" onClick={() => navigate('/login')} className="w-full sm:w-auto shadow-lg">
            Sign In to Platform
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Lock className="w-4 h-4 mr-2 text-primary-light" />
            Switch Demo Account
          </Button>
        </div>
      </div>
    </section>
  );
};
