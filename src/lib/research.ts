/** Líneas de investigación: carrusel del inicio y página interactiva de la sección. */
export interface ResearchLine {
  id: string
  glyph: string
  title: string
  text: string
  from: string
  to: string
  level: 'Inicial' | 'Intermedio' | 'Avanzado'
  topics: string[]
  tools: string[]
  projects: string[]
  resources: { name: string; url: string }[]
}

export const RESEARCH_LINES: ResearchLine[] = [
  {
    id: 'web',
    glyph: '</>',
    title: 'Seguridad web',
    text: 'OWASP Top 10, desarrollo seguro y pruebas sobre aplicaciones de laboratorio.',
    from: '#22d3a6',
    to: '#0f7a61',
    level: 'Inicial',
    topics: ['Inyección SQL', 'XSS', 'Control de acceso', 'Autenticación y sesiones', 'Desarrollo seguro', 'APIs REST'],
    tools: ['Burp Suite', 'OWASP ZAP', 'DevTools', 'sqlmap', 'Postman'],
    projects: ['Auditoría de una aplicación vulnerable a propósito (DVWA, Juice Shop)', 'Guía de desarrollo seguro para proyectos de la institución', 'Revisión de seguridad del sitio SIRSG 2.0'],
    resources: [
      { name: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
      { name: 'PortSwigger Academy', url: 'https://portswigger.net/web-security' },
    ],
  },
  {
    id: 'defensa',
    glyph: '[#]',
    title: 'Defensa y respuesta',
    text: 'Hardening, monitoreo de registros y respuesta ante incidentes.',
    from: '#38bdf8',
    to: '#1e40af',
    level: 'Intermedio',
    topics: ['Hardening de sistemas', 'Monitoreo y SIEM', 'Detección de amenazas', 'Plan de respuesta', 'Copias de seguridad'],
    tools: ['Wazuh', 'Splunk', 'Sysmon', 'Suricata', 'Linux'],
    projects: ['Laboratorio de monitoreo con Wazuh', 'Plan de respuesta a incidentes para un caso simulado', 'Checklist de hardening para servidores Linux'],
    resources: [
      { name: 'MITRE ATT&CK', url: 'https://attack.mitre.org' },
      { name: 'NIST CSF', url: 'https://www.nist.gov/cyberframework' },
    ],
  },
  {
    id: 'pentesting',
    glyph: '>_',
    title: 'Pentesting y CTF',
    text: 'Metodologías de pruebas de penetración y retos Capture The Flag.',
    from: '#f43f5e',
    to: '#7f1d1d',
    level: 'Intermedio',
    topics: ['Reconocimiento', 'Escaneo y enumeración', 'Explotación', 'Escalada de privilegios', 'Informes de pentesting'],
    tools: ['Kali Linux', 'Nmap', 'Metasploit', 'Gobuster', 'John the Ripper'],
    projects: ['Banco de retos CTF para nuevos integrantes', 'Participación en competencias de CTFtime', 'Write-ups de máquinas resueltas'],
    resources: [
      { name: 'Hack The Box', url: 'https://www.hackthebox.com' },
      { name: 'TryHackMe', url: 'https://tryhackme.com' },
    ],
  },
  {
    id: 'forense',
    glyph: '0x',
    title: 'Forense y malware',
    text: 'Evidencia digital y análisis de software malicioso en entornos aislados.',
    from: '#a78bfa',
    to: '#4c1d95',
    level: 'Avanzado',
    topics: ['Cadena de custodia', 'Análisis de memoria', 'Análisis de discos', 'Ingeniería inversa', 'Sandboxing'],
    tools: ['Autopsy', 'Volatility', 'Ghidra', 'Wireshark', 'REMnux'],
    projects: ['Análisis forense de una imagen de disco de práctica', 'Laboratorio aislado para análisis de malware', 'Guía de recolección de evidencia'],
    resources: [
      { name: 'CyberChef', url: 'https://gchq.github.io/CyberChef/' },
      { name: 'CISA KEV', url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
    ],
  },
  {
    id: 'cripto',
    glyph: '{k}',
    title: 'Criptografía y redes',
    text: 'Fundamentos criptográficos, protocolos seguros y seguridad en redes.',
    from: '#f59e0b',
    to: '#78350f',
    level: 'Intermedio',
    topics: ['Cifrado simétrico y asimétrico', 'Hashes y firmas', 'TLS', 'VPN', 'Segmentación de redes'],
    tools: ['OpenSSL', 'Wireshark', 'GnuPG', 'Packet Tracer', 'pfSense'],
    projects: ['Taller práctico de cifrado con OpenSSL', 'Análisis de tráfico de una red de laboratorio', 'Comparativa de protocolos VPN'],
    resources: [
      { name: 'CyberChef', url: 'https://gchq.github.io/CyberChef/' },
      { name: 'OverTheWire', url: 'https://overthewire.org/wargames/' },
    ],
  },
  {
    id: 'cultura',
    glyph: '@!',
    title: 'Cultura de seguridad',
    text: 'Divulgación, ingeniería social y buenas prácticas para todos.',
    from: '#2dd4bf',
    to: '#134e4a',
    level: 'Inicial',
    topics: ['Phishing', 'Ingeniería social', 'Contraseñas y MFA', 'Privacidad digital', 'Campañas de concienciación'],
    tools: ['Canva', 'GoPhish (en laboratorio)', 'Have I Been Pwned', 'Gestores de contraseñas'],
    projects: ['Campaña de concienciación para la institución', 'Charlas para estudiantes de primeros semestres', 'Guía de seguridad digital para docentes'],
    resources: [
      { name: 'ColCERT', url: 'https://www.colcert.gov.co' },
      { name: 'CVE', url: 'https://www.cve.org' },
    ],
  },
]

/** Mini test: cada respuesta suma puntos a una o varias líneas. */
export const QUIZ = [
  {
    question: '¿Qué te llama más la atención?',
    options: [
      { label: 'Encontrar fallas en páginas web', lines: ['web', 'pentesting'] },
      { label: 'Proteger sistemas y detectar ataques', lines: ['defensa'] },
      { label: 'Investigar qué pasó después de un ataque', lines: ['forense'] },
      { label: 'Enseñar a otros a cuidarse', lines: ['cultura'] },
    ],
  },
  {
    question: '¿Cómo prefieres trabajar?',
    options: [
      { label: 'Resolviendo retos contra reloj', lines: ['pentesting'] },
      { label: 'Programando y revisando código', lines: ['web', 'cripto'] },
      { label: 'Analizando datos y registros', lines: ['defensa', 'forense'] },
      { label: 'Hablando con personas', lines: ['cultura'] },
    ],
  },
  {
    question: '¿Qué tema te gustaría dominar?',
    options: [
      { label: 'Matemáticas y cifrado', lines: ['cripto'] },
      { label: 'Redes y servidores', lines: ['defensa', 'cripto'] },
      { label: 'Explotación y hacking ético', lines: ['pentesting', 'web'] },
      { label: 'Malware e ingeniería inversa', lines: ['forense'] },
    ],
  },
] as const
