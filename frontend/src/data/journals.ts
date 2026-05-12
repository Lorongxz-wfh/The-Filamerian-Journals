export interface Article {
  id: number;
  title: string;
  authors: string;
  abstract: string;
  pages: string;
  doi: string;
}

export interface Issue {
  id: number;
  number: number;
  publishedAt: string;
  articles: Article[];
}

export interface Volume {
  id: number;
  number: number;
  year: number;
  issues: Issue[];
}

export interface Journal {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: 'Science' | 'Education' | 'Arts' | 'Multidisciplinary';
  image: string;
  issn: string;
  frequency: string;
  editor: string;
  latestVolume: string;
  latestIssue: string;
  date: string;
  volumes: Volume[];
}

export const journals: Journal[] = [
  {
    id: 1,
    slug: 'fcu-multidisciplinary-research-journal',
    title: 'FCU Multidisciplinary Research Journal',
    description: 'The flagship publication featuring impactful research across all disciplines within the University. Covers science, education, humanities, and social sciences.',
    category: 'Multidisciplinary',
    image: 'https://picsum.photos/seed/res-blue/600/400',
    issn: '2651-7701',
    frequency: 'Biannual',
    editor: 'Dr. Julian Santos',
    latestVolume: '15',
    latestIssue: '01',
    date: 'March 2024',
    volumes: [
      {
        id: 1, number: 15, year: 2024,
        issues: [{
          id: 1, number: 1, publishedAt: 'March 2024',
          articles: [
            { id: 1, title: 'Community Resilience in Post-Pandemic Capiz: A Mixed-Methods Study', authors: 'Santos, J.; Reyes, M.', abstract: 'This study investigates community resilience strategies adopted by barangays in Capiz province during and after the COVID-19 pandemic, using a convergent mixed-methods design.', pages: '1-18', doi: '10.12345/fcumrj.2024.001' },
            { id: 2, title: 'Digital Literacy and Academic Performance Among Filipino College Students', authors: 'Dela Cruz, A.; Garcia, R.', abstract: 'Examines the relationship between digital literacy competencies and academic outcomes in Philippine higher education institutions.', pages: '19-35', doi: '10.12345/fcumrj.2024.002' },
            { id: 3, title: 'Sustainable Tourism Practices in Western Visayas', authors: 'Villanueva, P.', abstract: 'An assessment of eco-tourism initiatives and their economic impact on local communities in the Western Visayas region.', pages: '36-52', doi: '10.12345/fcumrj.2024.003' },
            { id: 4, title: 'Faith Integration in University Curriculum Development', authors: 'Tan, C.; Lim, K.', abstract: 'Explores models of faith-learning integration in Christian higher education institutions in the Philippines.', pages: '53-68', doi: '10.12345/fcumrj.2024.004' },
          ],
        }],
      },
      {
        id: 2, number: 14, year: 2023,
        issues: [
          {
            id: 2, number: 1, publishedAt: 'March 2023',
            articles: [
              { id: 5, title: 'Water Quality Assessment of Panay River Systems', authors: 'Garcia, R.; Bautista, E.', abstract: 'A comprehensive water quality analysis of major river systems in Panay Island using physicochemical and biological parameters.', pages: '1-22', doi: '10.12345/fcumrj.2023.001' },
              { id: 6, title: 'Teacher Competency Frameworks in K-12 Science Education', authors: 'Ramos, E.', abstract: 'Evaluates the effectiveness of competency-based frameworks in improving science instruction quality.', pages: '23-40', doi: '10.12345/fcumrj.2023.002' },
            ],
          },
          {
            id: 3, number: 2, publishedAt: 'September 2023',
            articles: [
              { id: 7, title: 'Mental Health Literacy Among University Personnel', authors: 'Santos, J.', abstract: 'Assesses mental health knowledge, attitudes, and help-seeking behaviors among faculty and staff.', pages: '1-16', doi: '10.12345/fcumrj.2023.003' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 2,
    slug: 'journal-of-christian-education',
    title: 'Journal of Christian Education',
    description: 'Bridging faith and learning through innovative pedagogical research and management. Focuses on Christian education theory and practice.',
    category: 'Education',
    image: 'https://picsum.photos/seed/edu-blue/600/400',
    issn: '2651-7728',
    frequency: 'Annual',
    editor: 'Prof. Maria Reyes',
    latestVolume: '08',
    latestIssue: '02',
    date: 'December 2023',
    volumes: [
      {
        id: 3, number: 8, year: 2024,
        issues: [{
          id: 4, number: 1, publishedAt: 'June 2024',
          articles: [
            { id: 8, title: 'Pedagogical Innovations in Faith-Based Education', authors: 'Dela Cruz, A.', abstract: 'Reviews innovative teaching approaches in faith-based educational institutions across Southeast Asia.', pages: '1-20', doi: '10.12345/jce.2024.001' },
            { id: 9, title: 'Effects of Blended Learning on Student Engagement', authors: 'Ramos, E.', abstract: 'Measures the impact of hybrid learning modalities on student participation and outcomes in Christian universities.', pages: '21-38', doi: '10.12345/jce.2024.002' },
          ],
        }],
      },
    ],
  },
  {
    id: 3,
    slug: 'filamerian-science-review',
    title: 'The Filamerian Science Review',
    description: 'Peer-reviewed innovations and scientific breakthroughs from the Filamerian community. Covers biology, chemistry, environmental science, and technology.',
    category: 'Science',
    image: 'https://picsum.photos/seed/sci-blue/600/400',
    issn: '2651-7736',
    frequency: 'Biannual',
    editor: 'Dr. Roberto Garcia',
    latestVolume: '12',
    latestIssue: '01',
    date: 'February 2024',
    volumes: [
      {
        id: 4, number: 12, year: 2024,
        issues: [{
          id: 5, number: 1, publishedAt: 'February 2024',
          articles: [
            { id: 10, title: 'AI-Driven Approaches to Marine Biodiversity Monitoring', authors: 'Garcia, R.; Lim, K.', abstract: 'Proposes machine learning models for automated species identification in coral reef ecosystems of the Visayan Sea.', pages: '1-24', doi: '10.12345/fsr.2024.001' },
            { id: 11, title: 'Phytochemical Screening of Endemic Panay Flora', authors: 'Bautista, E.', abstract: 'Identifies bioactive compounds in plant species endemic to Panay Island with potential pharmaceutical applications.', pages: '25-42', doi: '10.12345/fsr.2024.002' },
            { id: 12, title: 'Microplastic Contamination in Roxas City Coastal Waters', authors: 'Villanueva, P.; Santos, J.', abstract: 'Quantifies microplastic pollution levels and identifies primary sources in coastal waters surrounding Roxas City.', pages: '43-58', doi: '10.12345/fsr.2024.003' },
          ],
        }],
      },
    ],
  },
  {
    id: 4,
    slug: 'business-management-insights',
    title: 'Business & Management Insights',
    description: 'Research-driven strategies and insights for sustainable business development. Focuses on entrepreneurship, finance, and organizational management.',
    category: 'Multidisciplinary',
    image: 'https://picsum.photos/seed/bus-blue/600/400',
    issn: '2651-7744',
    frequency: 'Annual',
    editor: 'Dr. Ana Villanueva',
    latestVolume: '05',
    latestIssue: '01',
    date: 'January 2024',
    volumes: [
      {
        id: 5, number: 5, year: 2024,
        issues: [{
          id: 6, number: 1, publishedAt: 'January 2024',
          articles: [
            { id: 13, title: 'Sustainable Supply Chain Models for Island Economies', authors: 'Villanueva, P.', abstract: 'Develops optimized supply chain frameworks for small island developing economies in the Philippine archipelago.', pages: '1-19', doi: '10.12345/bmi.2024.001' },
            { id: 14, title: 'Fintech Adoption Among MSMEs in Capiz Province', authors: 'Tan, C.', abstract: 'Examines barriers and enablers of financial technology adoption among micro, small, and medium enterprises.', pages: '20-36', doi: '10.12345/bmi.2024.002' },
          ],
        }],
      },
    ],
  },
  {
    id: 5,
    slug: 'arts-humanities-quarterly',
    title: 'Arts & Humanities Quarterly',
    description: 'Scholarly perspectives on literature, philosophy, history, and the creative arts. Celebrates the cultural heritage of the Filamerian community.',
    category: 'Arts',
    image: 'https://picsum.photos/seed/arts-blue/600/400',
    issn: '2651-7752',
    frequency: 'Quarterly',
    editor: 'Prof. Carlo Tan',
    latestVolume: '03',
    latestIssue: '01',
    date: 'March 2024',
    volumes: [
      {
        id: 6, number: 3, year: 2024,
        issues: [{
          id: 7, number: 1, publishedAt: 'March 2024',
          articles: [
            { id: 15, title: 'Cultural Heritage Preservation through Digital Archives', authors: 'Bautista, L.; Tan, S.', abstract: 'Explores digitization strategies for preserving intangible cultural heritage in Capiz and Aklan provinces.', pages: '1-16', doi: '10.12345/ahq.2024.001' },
            { id: 16, title: 'Narrative Identity in Contemporary Visayan Literature', authors: 'Dela Cruz, A.', abstract: 'Analyzes identity construction in post-2000 Visayan literary works through a postcolonial lens.', pages: '17-30', doi: '10.12345/ahq.2024.002' },
          ],
        }],
      },
    ],
  },
  {
    id: 6,
    slug: 'theology-ministry-review',
    title: 'Theology & Ministry Review',
    description: 'Academic discourse on theological studies, pastoral ministry, and church leadership in the Philippine context.',
    category: 'Education',
    image: 'https://picsum.photos/seed/theo-blue/600/400',
    issn: '2651-7760',
    frequency: 'Annual',
    editor: 'Dr. Elena Bautista',
    latestVolume: '04',
    latestIssue: '01',
    date: 'November 2023',
    volumes: [
      {
        id: 7, number: 4, year: 2023,
        issues: [{
          id: 8, number: 1, publishedAt: 'November 2023',
          articles: [
            { id: 17, title: 'Contextual Theology in Philippine Island Communities', authors: 'Bautista, E.', abstract: 'Examines how island geography shapes theological reflection and ministry practice in the Visayas.', pages: '1-18', doi: '10.12345/tmr.2023.001' },
            { id: 18, title: 'Youth Ministry and Digital Engagement', authors: 'Ramos, E.; Santos, J.', abstract: 'Investigates the effectiveness of social media-based youth ministry programs in urban and rural parishes.', pages: '19-32', doi: '10.12345/tmr.2023.002' },
          ],
        }],
      },
    ],
  },
];

export function getJournalBySlug(slug: string): Journal | undefined {
  return journals.find((j) => j.slug === slug);
}

export function getJournalsByCategory(category: string): Journal[] {
  if (category === 'All') return journals;
  return journals.filter((j) => j.category === category);
}
