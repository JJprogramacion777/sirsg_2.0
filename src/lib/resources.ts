/** Grupos de recursos externos (pestañas del inicio). */
export const RESOURCE_GROUPS = [
  { id: 'practicar', label: 'Practicar', from: '#22d3a6', to: '#0b4a3c' },
  { id: 'estudiar', label: 'Estudiar', from: '#38bdf8', to: '#1e3a8a' },
  { id: 'al-dia', label: 'Al día', from: '#a78bfa', to: '#3b0764' },
] as const

/** Recursos externos recomendados para empezar en ciberseguridad. */
export const RESOURCES = [
  { group: 'practicar', name: 'PortSwigger Academy', url: 'https://portswigger.net/web-security', text: 'Laboratorios gratis de seguridad web.' },
  { group: 'practicar', name: 'TryHackMe', url: 'https://tryhackme.com', text: 'Rutas guiadas desde cero, en el navegador.' },
  { group: 'practicar', name: 'Hack The Box', url: 'https://www.hackthebox.com', text: 'Máquinas y retos para pentesting.' },
  { group: 'practicar', name: 'OverTheWire', url: 'https://overthewire.org/wargames/', text: 'Wargames para aprender Linux y explotación.' },
  { group: 'estudiar', name: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/', text: 'Los riesgos más críticos en aplicaciones web.' },
  { group: 'estudiar', name: 'MITRE ATT&CK', url: 'https://attack.mitre.org', text: 'Tácticas y técnicas reales de atacantes.' },
  { group: 'estudiar', name: 'NIST CSF', url: 'https://www.nist.gov/cyberframework', text: 'Marco para gestionar riesgos de seguridad.' },
  { group: 'estudiar', name: 'CyberChef', url: 'https://gchq.github.io/CyberChef/', text: 'Codificar, decodificar y analizar datos.' },
  { group: 'al-dia', name: 'CVE', url: 'https://www.cve.org', text: 'Catálogo público de vulnerabilidades.' },
  { group: 'al-dia', name: 'CISA KEV', url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', text: 'Vulnerabilidades explotadas activamente.' },
  { group: 'al-dia', name: 'CTFtime', url: 'https://ctftime.org', text: 'Calendario de competencias CTF.' },
  { group: 'al-dia', name: 'ColCERT', url: 'https://www.colcert.gov.co', text: 'Respuesta a incidentes en Colombia.' },
] as const
