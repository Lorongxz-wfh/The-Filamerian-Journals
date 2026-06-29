import React, { useState } from 'react';

const tabs = ['About Us', 'Submission Guidelines', 'Editorial Board', 'Ethics & Malpractice', 'Indexing & Abstracting'];

const About: React.FC = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="container-custom py-12 space-y-10">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl uppercase tracking-wider">About The Journals</h1>
        <p className="text-[14px] text-muted max-w-xl leading-relaxed mt-2">
          Information for authors, reviewers, and readers regarding our publication standards and policies.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-1/4 shrink-0">
          <div className="flex flex-col gap-1 border border-border bg-surface p-2 sticky top-24">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-primary hover:bg-background'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:w-3/4">
          <div className="bg-surface border border-border p-8 lg:p-10 min-h-[500px]">
            {activeTab === 'About Us' && (
              <div className="space-y-6 prose prose-sm max-w-none prose-headings:text-primary prose-headings:font-semibold prose-headings:uppercase prose-headings:tracking-wider prose-p:text-muted prose-p:leading-relaxed prose-a:text-secondary">
                <h2 className="text-lg">About The Filamerian Journals</h2>
                <p>The Filamerian Journals is the official academic publishing platform of Filamer Christian University. It serves as a conduit for scholarly communication, disseminating rigorous peer-reviewed research across various disciplines including education, theology, nursing, business, and the sciences.</p>
                <p>Our mission is to foster a culture of research excellence and intellectual inquiry within and beyond our academic community.</p>
                <h3 className="text-base mt-8">Open Access Policy</h3>
                <p>We are committed to the open exchange of ideas. All published articles are immediately and permanently free for everyone to read, download, copy, and distribute under the terms of the Creative Commons Attribution License.</p>
              </div>
            )}

            {activeTab === 'Submission Guidelines' && (
              <div className="space-y-6 prose prose-sm max-w-none prose-headings:text-primary prose-headings:font-semibold prose-headings:uppercase prose-headings:tracking-wider prose-p:text-muted prose-p:leading-relaxed prose-li:text-muted">
                <h2 className="text-lg">Submission Guidelines</h2>
                <p>We welcome original research articles, review papers, and short communications. Authors must ensure their submissions align with the aims and scope of the specific journal they are targeting.</p>
                <h3 className="text-base mt-6">Manuscript Preparation</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Manuscripts should be submitted in Microsoft Word (.docx) format.</li>
                  <li>Use Times New Roman, 12-point font, double-spaced with 1-inch margins on all sides.</li>
                  <li>Title page must include: Title, Author name(s), Affiliation(s), and corresponding author's email.</li>
                  <li>An abstract of 150-250 words is required, followed by 3-5 keywords.</li>
                  <li>All citations and references must adhere to the latest APA (American Psychological Association) format.</li>
                </ul>
                <h3 className="text-base mt-6">Submission Process</h3>
                <p>All manuscripts must be submitted electronically through the portal by an editorial staff member. If you are an author, please contact the editorial office directly.</p>
              </div>
            )}

            {activeTab === 'Editorial Board' && (
              <div className="space-y-6 prose prose-sm max-w-none prose-headings:text-primary prose-headings:font-semibold prose-headings:uppercase prose-headings:tracking-wider prose-p:text-muted prose-p:leading-relaxed">
                <h2 className="text-lg">Editorial Board</h2>
                <p>Our editorial board consists of distinguished scholars and experts committed to maintaining the highest standards of academic integrity and rigor.</p>
                <div className="mt-6 space-y-4">
                  <div className="border-l-2 border-primary pl-4">
                    <p className="font-semibold text-primary m-0">Dr. Julian Santos</p>
                    <p className="text-[12px] text-muted m-0">Editor-in-Chief, Filamerian Science Review</p>
                  </div>
                  <div className="border-l-2 border-primary pl-4">
                    <p className="font-semibold text-primary m-0">Prof. Maria Reyes</p>
                    <p className="text-[12px] text-muted m-0">Managing Editor, Education Perspectives</p>
                  </div>
                  <div className="border-l-2 border-primary pl-4">
                    <p className="font-semibold text-primary m-0">Dr. Ana Villanueva</p>
                    <p className="text-[12px] text-muted m-0">Associate Editor, Humanities & Arts</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Ethics & Malpractice' && (
              <div className="space-y-6 prose prose-sm max-w-none prose-headings:text-primary prose-headings:font-semibold prose-headings:uppercase prose-headings:tracking-wider prose-p:text-muted prose-p:leading-relaxed">
                <h2 className="text-lg">Publication Ethics and Publication Malpractice Statement</h2>
                <p>The Filamerian Journals adheres strictly to the guidelines set by the Committee on Publication Ethics (COPE).</p>
                <h3 className="text-base mt-6">Duties of Authors</h3>
                <ul className="list-disc pl-5 space-y-2 text-muted">
                  <li><strong>Originality and Plagiarism:</strong> Authors must ensure that their work is entirely original. Any work or words of others must be appropriately cited or quoted.</li>
                  <li><strong>Data Access and Retention:</strong> Authors may be asked to provide raw data in connection with a paper for editorial review.</li>
                  <li><strong>Multiple, Redundant or Concurrent Publication:</strong> Authors should not publish manuscripts describing essentially the same research in more than one journal.</li>
                </ul>
                <h3 className="text-base mt-6">Duties of Reviewers</h3>
                <p>Reviewers must assist in the editorial decision process and treat all manuscripts received for review as confidential documents. Reviews should be conducted objectively, with clear supporting arguments.</p>
              </div>
            )}

            {activeTab === 'Indexing & Abstracting' && (
              <div className="space-y-6 prose prose-sm max-w-none prose-headings:text-primary prose-headings:font-semibold prose-headings:uppercase prose-headings:tracking-wider prose-p:text-muted prose-p:leading-relaxed">
                <h2 className="text-lg">Indexing & Abstracting</h2>
                <p>We are actively working to expand the reach and visibility of research published in our journals. Our publications are currently indexed or abstracted in the following databases:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 border border-border bg-background flex items-center justify-center h-24">
                    <span className="font-semibold text-primary uppercase tracking-widest text-[13px]">ASEAN Citation Index</span>
                  </div>
                  <div className="p-4 border border-border bg-background flex items-center justify-center h-24">
                    <span className="font-semibold text-primary uppercase tracking-widest text-[13px]">Google Scholar</span>
                  </div>
                  <div className="p-4 border border-border bg-background flex items-center justify-center h-24">
                    <span className="font-semibold text-primary uppercase tracking-widest text-[13px]">Crossref (DOI)</span>
                  </div>
                  <div className="p-4 border border-border bg-background flex items-center justify-center h-24">
                    <span className="font-semibold text-primary uppercase tracking-widest text-[13px] text-center">Philippine E-Journals</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
