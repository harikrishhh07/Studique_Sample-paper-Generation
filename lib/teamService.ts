export interface TeamMember {
  id: number;
  name: string;
  img: string;
  role?: string;
  year?: string;
  links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    instagram?: string;
  };
  type: "founding" | "core" | "contributor";
}

export interface TeamStats {
  totalMembers: number;
  foundingMembers: number;
  coreMembers: number;
  contributors: number;
  years: string[];
}

class TeamProcessor {
  private teamData: TeamMember[] = [
    // Founding Team Members
    {
      id: 1,
      name: "Gaurav Mishra",
      img: "/images/team/gaurav.png",
      type: "founding",
      links: {
        github: "https://github.com/mishragaurav08",
        linkedin: "https://www.linkedin.com/in/mishragaurav08",
        portfolio: "https://gauravmishra.dev/",
        instagram: "https://www.instagram.com/mishragaurav08/",
      },
    },
    {
      id: 2,
      name: "Utkarsh Jaiswal",
      img: "/images/team/utkarsh.png",
      type: "founding",
      links: {
        github: "https://github.com/UtkarshJaiswal1406",
        linkedin: "https://www.linkedin.com/in/1406utkarsh/",
        portfolio: "https://karshj.framer.website/",
        instagram: "https://www.instagram.com/its_karshj/",
      },
    },
    {
      id: 3,
      name: "Utakarsh Jain",
      img: "/images/team/utakarsh.png",
      type: "founding",
      links: {
        github: "https://github.com/Utkarsh-Jain",
        linkedin: "https://www.linkedin.com/in/utakarsh-jain/",
        portfolio: "https://utakarshjain.vercel.app/",
        instagram: "https://www.instagram.com/utakarsh_jain/",
      },
    },
    {
      id: 4,
      name: "Manya Sewkani",
      img: "/images/team/manya.png",
      type: "founding",
      links: {
        github: "https://github.com/sewkani-manya",
        linkedin: "https://www.linkedin.com/in/manya-sewkani-50292a1aa/",
        instagram: "https://www.instagram.com/manya_sewkani/",
      },
    },
    {
      id: 5,
      name: "Chirag Khairnar",
      img: "/images/team/chirag.png",
      role: "Dev Lead",
      type: "founding",
      links: {
        github: "https://github.com/LegendCK",
        linkedin: "https://www.linkedin.com/in/chiragkhairnar/",
        instagram: "https://www.instagram.com/chiragkhairnar12/",
        portfolio: "https://chiragkhairnar.dev/"
      },
    },
    // Core Team Members
    {
      id: 6,
      name: "Rishit",
      img: "/images/team/rishit.png",
      role: "Dev Lead",
      type: "core",
      links: {
        github: "https://github.com/rishit-exe",
        linkedin: "https://www.linkedin.com/in/the-rishit-srivastava/",
        instagram: "https://instagram.com/rishit._.srivastava",
      },
    },
    {
      id: 7,
      name: "Aakarsh Kumar",
      img: "/images/team/aakarsh.png",
      role: "Developer",
      type: "core",
      links: {
        github: "https://github.com/Aakarsh-Kumar",
        linkedin: "https://www.linkedin.com/in/aakarsh-kumar25",
        instagram: "https://instagram.com/aakarsh_kumar25",
      },
    },
    {
      id: 8,
      name: "Sharu Nethra",
      img: "/images/team/sharu.png",
      role: "Developer",
      type: "core",
      links: {
        github: "https://github.com/Sharunethra",
        linkedin: "https://www.linkedin.com/in/sharu-nethra-r-18a48b346",
        instagram: "https://www.instagram.com/__sharuuuu._?utm_source=qr&igsh=MXNoYXB6bXUzaGc0ZQ==",
      },
    },
    {
      id: 9,
      name: "Harmandeep Singh",
      img: "/images/team/harmandeep.jpeg",
      role: "Developer",
      type: "core",
      links: {
        github: "https://github.com/Harmandeeep2312",
        linkedin: "https://www.linkedin.com/in/harmandeep-singh-b0b469380",
        instagram: "https://www.instagram.com/_hrmn._12",
      },
    },
    {
      id: 10,
      name: "Manshi",
      img: "/images/team/manshi.png",
      role: "Design Lead",
      type: "core",
      links: {
        linkedin: "https://www.linkedin.com/in/manshi-up15",
        github: "https://github.com/Manshi-up15",
      },
    },
    {
      id: 11,
      name: "Chaarvi Nikam",
      img: "/images/team/chaarvi.png",
      role: "Design & Resources",
      type: "core",
      links: {
        linkedin: "https://www.linkedin.com/in/chaarvi-nikam-bb1a01381/",
        instagram: "https://www.instagram.com/my_therapists_life",
      },
    },
    {
      id: 12,
      name: "Krishved Dugtal",
      img: "/images/team/krishved.jpg",
      role: "Outreach",
      type: "core",
      links: {
        linkedin: "https://www.linkedin.com/in/krishved-singh-dugtal-548a00330/",
        github: "https://github.com/krishdugtal",
        instagram: "https://www.instagram.com/krish.dugtal",
      },
    },
    {
      id: 13,
      name: "Pranika",
      img: "/images/team/pranika.png",
      role: "Outreach & Permissions",
      type: "core",
      links: {
        linkedin: "https://www.linkedin.com/in/pranika-rana-880b46377/",
      },
    },
    {
      id: 14,
      name: "Venkat Karthik J",
      img: "/images/team/venkat.png",
      role: "Dev & Permissions",
      type: "core",
      links: {
        linkedin: "https://www.linkedin.com/in/venkatkarthikj/",
        github: "https://github.com/Karthik-jayanthi",
        instagram: "https://www.instagram.com/ikxrthiik?igsh=N3FwM3A1eG9wMDll",
      },
    },
    {
      id: 15,
      name: "Azam",
      img: "/images/team/azam.png",
      role: "Resources Team",
      type: "core",
      links: {
        linkedin: "https://www.linkedin.com/in/azam-ali-373587341/",
        github: "https://github.com/AzamAliCodes",
      },
    },
    {
      id: 16,
      name: "Fatha Ali",
      img: "/images/team/fatha.png",
      role: "Resources Team",
      type: "core",
      links: {
      },
    },
    {
      id: 17,
      name: "Tushar",
      img: "/images/team/tushar.png",
      role: "Resources Team",
      type: "core",
      links: {
        github: "https://github.com/TusharB-07",
        linkedin: "https://www.linkedin.com/in/tusharnbiswas/",
      },
    },
    // Contributors
    {
      id: 18,
      name: "Aashvi Swaroop",
      img: "/images/contributors/aashvi.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/aashvi-swaroop",
      },
    },
    {
      id: 19,
      name: "Aasha Kumari",
      img: "/images/contributors/aasha.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/aasha-kumari-4a0b2926b/",
      },
    },
    {
      id: 20,
      name: "Aditi Jha",
      img: "/images/contributors/aditi.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/aditijha29/",
      },
    },
    {
      id: 21,
      name: "Ananya",
      img: "/images/contributors/ananya.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/ananya-tripathi-1b953b324/",
      },
    },
    {
      id: 22,
      name: "Anish Gurusankar",
      img: "/images/contributors/anish.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/anish-gurusankar/",
      },
    },
    {
      id: 23,
      name: "Anshika Yadav",
      img: "/images/contributors/anshika.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/anshika-yadav-58b371282",
      },
    },
    {
      id: 24,
      name: "Anuja Pandey",
      img: "/images/contributors/anuja.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/anuja-pandey-62b089295/",
      },
    },
    {
      id: 25,
      name: "Aryan",
      img: "/images/contributors/aryangupta.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/aryan-gupta-1058aa209/",
      },
    },
    {
      id: 26,
      name: "Aryan Dwivedi",
      img: "/images/contributors/aryan.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/aryan10084/",
      },
    },
    {
      id: 27,
      name: "Aryan Raj",
      img: "/images/contributors/aryanraj.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/826aryan/",
      },
    },
    {
      id: 28,
      name: "Deepanjali Singh",
      img: "/images/contributors/deepanjali.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/deepanjali-singh-48a060289/",
      },
    },
    {
      id: 29,
      name: "Dhruv",
      img: "/images/contributors/dhruv.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/dhruv-jha/",
      },
    },
    {
      id: 30,
      name: "Diptayan Jash",
      img: "/images/contributors/diptayan.png",
      year: "2022 - 2026",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/diptayanjash/",
      },
    },
    {
      id: 31,
      name: "Duaa Mohammed Ali",
      img: "/images/contributors/duaa.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/duaa-mohd-ali/",
      },
    },
    {
      id: 32,
      name: "G.S. Sonal",
      img: "/images/contributors/sonal.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/g-s-sonal-3805a8252",
      },
    },
    {
      id: 33,
      name: "Geetanjali Reddy",
      img: "/images/contributors/geetanjali.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/geetanjali-reddy-384278280/",
      },
    },
    {
      id: 34,
      name: "Gunit",
      img: "/images/contributors/gunit.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/gunit-chawla/",
      },
    },
    {
      id: 35,
      name: "Hersita Chandak",
      img: "/images/contributors/hersita.jpg",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/hersita-chandak-831194265",
      },
    },
    {
      id: 36,
      name: "Jaya",
      img: "/images/contributors/jaya.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/jaya-somasundaram-8901ab27a/",
      },
    },
    {
      id: 37,
      name: "Kartik Goyal",
      img: "/images/contributors/kartik.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/kartik-goyal-470660287/",
      },
    },
    {
      id: 38,
      name: "Koushigan Srinivasan",
      img: "/images/contributors/koushigan.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/koushigan-srinivasan-0b4582324/",
      },
    },
    {
      id: 39,
      name: "Krishved",
      img: "/images/contributors/krishved.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin:
          "https://www.linkedin.com/in/krishved-singh-dugtal-548a00330/",
      },
    },
    {
      id: 40,
      name: "Madhav",
      img: "/images/contributors/madhav.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/madhav-bhardwaj-a6a4bb1ba/",
      },
    },
    {
      id: 41,
      name: "Manshi Gupta",
      img: "/images/contributors/manshigupta.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/manshi-gupta-25a049354/",
      },
    },
    {
      id: 42,
      name: "Navanita",
      img: "/images/contributors/navanita.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/navanita2005/",
      },
    },
    {
      id: 43,
      name: "Nikhil Kumar",
      img: "/images/contributors/nikhil.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/nikhil-kumar-8bab6b298/",
      },
    },
    {
      id: 44,
      name: "payal",
      img: "/images/contributors/payal.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/payal-chatterjeee-a457a7382",
      },
    },
    {
      id: 45,
      name: "Praneeth Kumar",
      img: "/images/contributors/praneeth.jpg",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://in.linkedin.com/in/praneeth-kumar-garre-a6048a1b3",
      },
    },
    {
      id: 46,
      name: "Prathyush",
      img: "/images/contributors/prathyush.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/prathyushharan/",
      },
    },
    {
      id: 47,
      name: "Puneet",
      img: "/images/contributors/puneet.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/puneetkh16/",
      },
    },
    {
      id: 48,
      name: "Riya Thomas",
      img: "/images/contributors/riya.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/riya-thomas-244a2a318/",
      },
    },
    {
      id: 49,
      name: "Saumya Dhote",
      img: "/images/contributors/saumya.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/saumya-dhote-304965306/",
      },
    },
    {
      id: 50,
      name: "Sarthak",
      img: "/images/contributors/sarthak.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/sarthak-rastogi-951811290/",
      },
    },
    {
      id: 51,
      name: "Shambhavi",
      img: "/images/contributors/shambhavi.png",
      year: "2024 - 2028",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/shambhavi-seth-a5879535a/",
      },
    },
    {
      id: 52,
      name: "Shasmitha",
      img: "/images/contributors/shasmitha.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/shasmitha-r-7ba139177/",
      },
    },
    {
      id: 53,
      name: "Srikanth",
      img: "/images/contributors/srikanth.jpeg",
      year: "2025 - 2029",
      type: "contributor",
      links: {
        linkedin: "https://linkedin.com/in/saisrikanths",
      },
    },
    {
      id: 54,
      name: "Sudhir Singh",
      img: "/images/contributors/sudhir.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/sudhir-singh-840603250/",
      },
    },
    {
      id: 55,
      name: "Sushant Chavan",
      img: "/images/contributors/sushant.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/chavansushant/",
      },
    },
    {
      id: 56,
      name: "Suyash Jain",
      img: "/images/contributors/suyash.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/jsuyash05/",
      },
    },
    {
      id: 57,
      name: "Swasteek",
      img: "/images/contributors/swasteek.png",
      year: "2025 - 2029",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/s-swasteek-4b67a2392/",
      },
    },
    {
      id: 58,
      name: "Tanay",
      img: "/images/contributors/tanay.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/tanay-patel-231734288/",
      },
    },
    {
      id: 59,
      name: "Titas",
      img: "/images/contributors/titas.png",
      year: "2023-2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/titas018/",
      },
    },
    {
      id: 60,
      name: "Tushika",
      img: "/images/contributors/tushika.png",
      year: "2025 - 2029",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/tushika-tibrewal/",
      },
    },
    {
      id: 61,
      name: "Vikash",
      img: "/images/contributors/vikash.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/vikash-m-b06a97263/",
      },
    },
    {
      id: 62,
      name: "Krish Kumar",
      img: "/images/contributors/krishkumar.png",
      year: "2023 - 2027",
      type: "contributor",
      links: {
        linkedin: "https://www.linkedin.com/in/krish-kumar-1a119728a/",
      },
    }
  ];

  private foundingTeamIndexes = new Map<number, TeamMember>();
  private coreTeamIndexes = new Map<number, TeamMember>();
  private contributorIndexes = new Map<number, TeamMember>();
  private yearIndexes = new Map<string, TeamMember[]>();

  constructor() {
    this.initializeIndexes();
  }

  private initializeIndexes() {
    // Create efficient lookups
    this.teamData.forEach((member) => {
      if (member.type === "founding") {
        this.foundingTeamIndexes.set(member.id, member);
      } else if (member.type === "core") {
        this.coreTeamIndexes.set(member.id, member);
      } else if (member.type === "contributor") {
        this.contributorIndexes.set(member.id, member);

        // Index by year for contributors
        if (member.year) {
          if (!this.yearIndexes.has(member.year)) {
            this.yearIndexes.set(member.year, []);
          }
          this.yearIndexes.get(member.year)!.push(member);
        }
      }
    });
  }

  getFoundingTeam(): TeamMember[] {
    return Array.from(this.foundingTeamIndexes.values());
  }

  getCoreTeam(): TeamMember[] {
    return Array.from(this.coreTeamIndexes.values());
  }

  getContributors(): TeamMember[] {
    return Array.from(this.contributorIndexes.values());
  }

  getContributorsByYear(year: string): TeamMember[] {
    return this.yearIndexes.get(year) || [];
  }

  getAllMembers(): TeamMember[] {
    return [...this.teamData];
  }

  getTeamStats(): TeamStats {
    const years = Array.from(this.yearIndexes.keys()).sort();
    return {
      totalMembers: this.teamData.length,
      foundingMembers: this.foundingTeamIndexes.size,
      coreMembers: this.coreTeamIndexes.size,
      contributors: this.contributorIndexes.size,
      years,
    };
  }

  getMemberById(id: number): TeamMember | undefined {
    return this.teamData.find((member) => member.id === id);
  }

  searchMembers(query: string): TeamMember[] {
    const searchTerm = query.toLowerCase();
    return this.teamData.filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm) ||
        member.role?.toLowerCase().includes(searchTerm) ||
        member.year?.toLowerCase().includes(searchTerm),
    );
  }
}

// Export singleton instance for efficient reuse
export const teamService = new TeamProcessor();
