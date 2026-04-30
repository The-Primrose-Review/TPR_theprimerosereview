
import React, { useState } from 'react';
import { MultipleQuestion } from '@/types/onboarding';
import { Input } from '@/components/ui/input';
import figures from '@/data/steps/inspirationalFigures';
import { Card } from "@/components/ui/card";

interface InspirationalFiguresGridProps {
  question: MultipleQuestion;
  value: string[];
  onChange: (value: string[]) => void;
  hasInteracted: boolean;
  setHasInteracted: (value: boolean) => void;
}

export const InspirationalFiguresGrid: React.FC<InspirationalFiguresGridProps> = ({
  question,
  value = [],
  onChange,
  hasInteracted,
  setHasInteracted
}) => {
  const [otherFigureName, setOtherFigureName] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  // Changed type to string | null to match figure.id which is a string
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  const handleSelection = (name: string) => {
    setHasInteracted(true);
    
    if (name === "Other") {
      if (value.includes(name)) {
        // Deselect "Other"
        onChange(value.filter(v => v !== name));
        setShowOtherInput(false);
      } else if (value.length < (question.maxChoices || 3)) {
        // Select "Other"
        onChange([...value, name]);
        setShowOtherInput(true);
      }
    } else {
      // Handle regular figure selection
      if (value.includes(name)) {
        onChange(value.filter(v => v !== name));
      } else if (value.length < (question.maxChoices || 3)) {
        onChange([...value, name]);
      }
    }
  };

  const handleOtherInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherFigureName(e.target.value);
  };

  // Get biography for a figure
  const getFigureBio = (name: string) => {
    switch (name) {
      case "Steve Jobs":
        return "Co-founder of Apple, Jobs was known for his visionary leadership and innovative thinking. He revolutionized multiple industries including personal computers, animation, music, phones, and tablet computing.";
      case "Oprah Winfrey":
        return "Media executive, actress, and philanthropist who overcame poverty and abuse to become one of the most influential women in the world. Known for her empathy and ability to connect with people from all walks of life.";
      case "Malala Yousafzai":
        return "Education activist who defied the Taliban in Pakistan and survived an assassination attempt to become the youngest Nobel Prize laureate. She continues to advocate for girls' right to education worldwide.";
      case "Ruth Bader Ginsburg":
        return "Supreme Court Justice who spent her career advocating for gender equality and women's rights. Her legal legacy and perseverance made her a cultural icon and champion for social justice.";
      case "Serena Williams":
        return "Tennis champion with 23 Grand Slam singles titles who redefined athleticism and broke barriers in sports. Known for her mental strength, resilience, and advocacy for equality.";
      case "Albert Einstein":
        return "Theoretical physicist who developed the theory of relativity, one of the pillars of modern physics. His intellectual achievements and originality have made him synonymous with genius.";
      case "J.K. Rowling":
        return "Author of the Harry Potter series who rose from poverty to become one of the world's best-selling authors. Her imagination created a global phenomenon that has inspired generations of readers.";
      case "Michelle Obama":
        return "Former First Lady, attorney, and author known for her advocacy for healthy families, education, and international adolescent girls' education. Her memoir 'Becoming' is one of the best-selling books of all time.";
      case "Marie Curie":
        return "Pioneering physicist and chemist who discovered polonium and radium, developed the theory of radioactivity, and became the first woman to win a Nobel Prize. Her groundbreaking research in radiation forever changed science despite facing significant gender barriers.";
      case "Magic Johnson":
        return "NBA legend who transformed basketball with his unique playing style and leadership. After his HIV diagnosis, he became a powerful advocate for HIV/AIDS awareness and successful entrepreneur, showing remarkable resilience and business acumen.";
      case "Taylor Swift":
        return "Grammy-winning singer-songwriter who has continually reinvented herself while maintaining artistic integrity and business savvy. Her ability to connect deeply with audiences through personal storytelling and take control of her career has made her a powerful cultural force.";
      case "Simone Biles":
        return "Most decorated gymnast in history who revolutionized the sport with unprecedented skills while advocating for athletes' mental health. Her courage to prioritize wellbeing over competition at the Olympic level sparked essential conversations about performance pressure.";
      case "Mark Zuckerberg":
        return "Founder of Facebook who transformed how billions of people connect and share information. His vision to build social technology at unprecedented scale, combined with his focus on innovation, has redefined modern communication and entrepreneurship.";
      case "Frida Kahlo":
        return "Revolutionary Mexican artist whose powerful self-portraits explored identity, gender, class, and race. Despite lifelong physical pain from childhood polio and a bus accident, she created deeply personal art that challenged conventional ideas about femininity and beauty.";
      case "Other":
        return "Someone whose achievements and values resonate with you personally. Their story has impacted your life in meaningful ways that shape your aspirations.";
      default:
        return "A figure whose journey and achievements have made a significant impact on society and possibly your own life path.";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {figures.map((figure) => (
          <div 
            key={figure.id} 
            className="h-[220px] sm:h-[280px] perspective-1000" 
            onMouseEnter={() => setFlippedCardId(figure.id)} 
            onMouseLeave={() => setFlippedCardId(null)} 
            onClick={() => handleSelection(figure.name)}
          >
            <div 
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                flippedCardId === figure.id ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front of card */}
              <Card 
                className={`absolute w-full h-full backface-hidden cursor-pointer transition-all duration-300 hover:shadow-md ${
                  value.includes(figure.name) ? 'ring-2 ring-primary shadow-md' : ''
                }`}
              >
                <div className="p-4 flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center mb-3 shrink-0">
                    {figure.image ? (
                      <img
                        src={figure.image}
                        alt={figure.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl font-bold text-primary">+</span>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm sm:text-base font-medium">{figure.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{figure.category}</p>
                  </div>
                </div>
              </Card>
              
              {/* Back of card */}
              <Card 
                className={`absolute w-full h-full backface-hidden rotate-y-180 cursor-pointer overflow-hidden ${
                  value.includes(figure.name) ? 'ring-2 ring-primary shadow-md' : ''
                }`}
              >
                <div className="p-4 flex flex-col h-full justify-between">
                  <div className="overflow-y-auto h-full">
                    <h4 className="font-medium mb-2 text-center">{figure.name}</h4>
                    <p className="text-xs sm:text-sm">{getFigureBio(figure.name)}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ))}
      </div>

      {showOtherInput && (
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium">
            Who else inspires you?
          </label>
          <Input
            type="text"
            placeholder="Enter name of inspirational figure"
            value={otherFigureName}
            onChange={handleOtherInputChange}
            className="w-full"
          />
        </div>
      )}

      {hasInteracted && value.length > 0 && question.followUp && (
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">
            {question.followUp.placeholder}
          </label>
          <textarea
            className="w-full p-3 border rounded-md"
            placeholder="Share your thoughts..."
            maxLength={question.followUp.maxLength}
          />
        </div>
      )}
    </div>
  );
}
