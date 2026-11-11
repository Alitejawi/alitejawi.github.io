export const site: {
  name: 'Ali Al-Itejawi';
  role: 'Principal Systems Engineer';
  headline: string;
  lede: string;
  url: 'https://itejawi.com';
  email: 'ali@itejawi.com';
  location: 'Amsterdam';
  timeZone: 'Europe/Amsterdam';
  links: {
    github: 'https://github.com/alitejawi';
    linkedin: 'https://www.linkedin.com/in/alitejawi/';
  };
  showDates: false;
  stack: { name: string; role: string }[];
  ticker: string[];
} = {
  name: 'Ali Al-Itejawi',
  role: 'Principal Systems Engineer',
  headline: 'I make corporate infrastructure quiet.',
  lede: 'Secure, automated, invisible. Okta, Google Workspace, Jamf, and the AI systems I build on top.',
  url: 'https://itejawi.com',
  email: 'ali@itejawi.com',
  location: 'Amsterdam',
  timeZone: 'Europe/Amsterdam',
  links: {
    github: 'https://github.com/alitejawi',
    linkedin: 'https://www.linkedin.com/in/alitejawi/',
  },
  showDates: false,
  stack: [
    { name: 'Okta', role: 'Identity' },
    { name: 'Google Workspace', role: 'GAM' },
    { name: 'Jamf Pro', role: 'Endpoint' },
    { name: 'Python', role: 'Pipelines' },
    { name: 'Ollama', role: 'Local LLMs' },
  ],
  ticker: ['Currently building AI pipelines that run every day'],
};
