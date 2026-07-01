import React from 'react';
import { Link } from 'react-router';
import { MailCheck } from 'lucide-react';
import Button from '@/components/ui/Button';

const PendingVerification: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 bg-surface border border-border p-8 text-center relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-blue-500/5 rounded-br-full pointer-events-none" />

        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <MailCheck className="h-8 w-8" />
          </div>
        </div>

        <h1 className="text-2xl text-primary font-display uppercase tracking-wider">Check Your Email</h1>
        
        <div className="space-y-4 text-[14px] text-muted leading-relaxed">
          <p>
            We've sent a verification link to your email address. 
            Please click the link to verify your identity.
          </p>
          <div className="p-4 bg-background border border-border text-left">
            <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-2">What happens next?</h3>
            <ol className="list-decimal pl-4 space-y-1.5 text-[13px]">
              <li>Verify your email address.</li>
              <li>An Administrator will review your account.</li>
              <li>Once approved, you can log in to submit manuscripts.</li>
            </ol>
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-6">
          <Link to="/login">
            <Button variant="outline" className="w-full py-3 text-[13px]">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PendingVerification;
