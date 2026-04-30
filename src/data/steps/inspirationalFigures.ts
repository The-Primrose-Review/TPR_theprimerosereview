
import { Step } from "../../types/onboarding";

const figures = [
  { id: "steve_jobs", name: "Steve Jobs", category: "Technology & Vision", image: "/lovable-uploads/ad4e6739-3d22-45ea-8d07-b26f97530a13.png" },
  { id: "oprah_winfrey", name: "Oprah Winfrey", category: "Media & Leadership", image: "/lovable-uploads/3190b4a7-96de-4fbb-8aa0-9ac950151fbc.png" },
  { id: "malala_yousafzai", name: "Malala Yousafzai", category: "Activism & Education", image: "/lovable-uploads/561c84b7-cbd6-4f23-aa70-63ad97c1da97.png" },
  { id: "ruth_bader_ginsburg", name: "Ruth Bader Ginsburg", category: "Law & Justice", image: "/lovable-uploads/bc42dee3-79db-4832-8354-daf65f813d19.png" },
  { id: "serena_williams", name: "Serena Williams", category: "Sports & Determination", image: "/lovable-uploads/3a1440cb-8525-4bcb-88af-e2e5b9b3bd8b.png" },
  { id: "albert_einstein", name: "Albert Einstein", category: "Science & Curiosity", image: "/lovable-uploads/2e3cef92-a098-4da3-a87f-f0de3272c166.png" },
{ id: "marie_curie", name: "Marie Curie", category: "Science & Pioneering", image: "/lovable-uploads/d5ded044-e5fc-4873-a096-06c9020f00f6.png" },
  { id: "magic_johnson", name: "Magic Johnson", category: "Sports & Resilience", image: "/lovable-uploads/fc182d2b-f322-4e21-88cb-1bc33f152ba8.png" },
  { id: "taylor_swift", name: "Taylor Swift", category: "Creativity & Reinvention", image: "/lovable-uploads/4d5e6097-4a4f-4b2c-8570-c66f6d1278e5.png" },
  { id: "simone_biles", name: "Simone Biles", category: "Excellence & Mental Health", image: "/lovable-uploads/e31bd82a-1960-464e-8e32-a6e18d0546e3.png" },
  { id: "mark_zuckerberg", name: "Mark Zuckerberg", category: "Tech & Scale", image: "/lovable-uploads/d004ba49-ec64-429a-8c8f-be44d81a761a.png" },
  { id: "frida_kahlo", name: "Frida Kahlo", category: "Art & Identity", image: "/lovable-uploads/593cd46c-b7a6-474b-9f5c-11c3e8df7987.png" },
  { id: "michelle_obama", name: "Michelle Obama", category: "Leadership & Social Impact", image: "/lovable-uploads/a8a4a489-eacb-4d4b-9b32-258d4e38a9a4.png" },
  { id: "other", name: "Other", category: "Custom Selection", image: "" }
];

export const inspirationalFiguresStep: Step = {
  title: "Whose journey, achievements, and values inspire you the most?",
  description: "Choose a figure whose success, leadership, or resilience motivates you in your academic and career journey. Your choice helps us better understand your aspirations and goals.",
  questions: [
    {
      id: "inspirational_figures",
      question: "Select up to three figures who inspire you:",
      type: "multiple",
      options: figures.map(figure => figure.name),
      maxChoices: 3,
      followUp: {
        type: "text",
        placeholder: "What about these figures resonates with you the most?",
        maxLength: 300,
      }
    }
  ]
};

export default figures;
