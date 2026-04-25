import { FaGithub, FaTwitter, FaLinkedin, FaDiscord } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import BrandLogo from '@/components/branding/BrandLogo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'Learning Modes', href: '#video-lectures' },
        { name: 'How It Works', href: '#how-it-works' },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#' },
        { name: 'Blog', href: '#' },
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', href: '/help-center' },
        { name: 'Privacy', href: '#' },
      ]
    }
  ];

  return (
    <footer className="w-full bg-[#0a0f2c] pt-20 pb-10 border-t border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand Section */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group">
              <BrandLogo iconClassName="h-8 w-8" textClassName="text-xl" />
            </Link>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs mb-6">
              Empowering educators and students with professional Generative AI tools.
            </p>
            <div className="flex gap-3">
              {[
                { icon: FaTwitter, href: '#' },
                { icon: FaGithub, href: '#' },
                { icon: FaLinkedin, href: '#' },
                { icon: FaDiscord, href: '#' },
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="col-span-1">
              <h4 className="text-white font-bold text-[10px] uppercase tracking-[0.2em] mb-5">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-slate-400 hover:text-purple-400 font-medium transition-colors text-[13px]"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-500 text-[11px] font-medium tracking-wide">
            © {currentYear} IntelliLearn. Professional AI Education Platform.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">Privacy</a>
            <a href="#" className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}


