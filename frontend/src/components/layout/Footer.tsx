import { Icon } from '@/components/ui/Icon';

const footerLinks = [
  { name: 'Documentation', href: '#docs' },
  { name: 'Privacy Policy', href: '#privacy' },
  { name: 'Smart Contract', href: '#contract' },
];

export const Footer = () => {
  return (
    <footer className="w-full flex justify-center px-4 py-16 bg-gradient-to-b from-background-dark to-black border-t border-border-dark">
      <div className="layout-content-container items-center text-center">
        <h2 className="text-white text-3xl font-bold mb-6">
          Ready to secure the future?
        </h2>
        <p className="text-text-secondary mb-8 max-w-[600px] mx-auto">
          Join municipalities and contractors already using Optic-Gov to ensure 
          transparency and efficiency.
        </p>
        
        <button 
          className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary hover:bg-primary-dark text-white text-base font-bold transition-all shadow-lg hover:shadow-primary/40 mb-12 mx-auto focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background-dark"
          onClick={() => window.open('/register', '_self')}
        >
          Start Verifying Now
        </button>
        
        <div className="w-full h-[1px] bg-border-dark mb-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-6 text-sm text-text-secondary">
          <div className="flex items-center gap-2 text-white">
            <Icon name="verified_user" className="text-primary" />
            <span className="font-bold">Optic-Gov</span>
          </div>
          
          <nav className="flex gap-8">
            {footerLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-white transition-colors focus:outline-none focus:text-white"
              >
                {link.name}
              </a>
            ))}
          </nav>
          
          <div className="text-xs text-gray-500">
            © 2023 Optic-Gov Project. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};