Zaktualizowany tech-stack z krótkim kontekstem:

Frontend  
• Astro 5 – statyczne strony z React islands, błyskawiczny TTI.  
• React 19 – bogaty ekosystem wykresów/PDF, łatwa interaktywność.  
• TypeScript 5 – silne typowanie CSV i API, mniej błędów runtime.  
• Tailwind 4 – utility-first CSS, szybkie prototypowanie UI.  
• shadcn/ui – gotowe, dostępne w React komponenty klasy enterprise.

Backend i baza danych  
• Supabase – Postgres + Auth + Storage, wspiera rollback partii i RLS.

AI  
• OpenAI API – dla generowania raportu.

CI/CD i hosting  
• GitHub Actions – automatyczne buildy i testy przy każdym commicie.  
• Cloudflare Pages – edge-deploy, WAF i certyfikaty SSL bez konfiguracji. Hosting zintegrowany z CI/CD dla automatycznych wdrożeń.

Testowanie
• Vitest – testy jednostkowe i integracyjne, weryfikacja logiki biznesowej.
• React Testing Library – testowanie komponentów React w izolacji.
• Playwright – testy E2E, symulacja realnych scenariuszy użytkownika.
