import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_KEY = 'tpr_student_tour_v1';

export const startStudentTour = () => {
  const d = driver({
    showProgress: true,
    progressText: 'Step {{current}} of {{total}}',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: "Let's go! 🎉",
    steps: [
      {
        popover: {
          title: '👋 Welcome to your Student Portal!',
          description:
            "You're all set up! Let's take a quick tour so you know exactly where everything lives.",
        },
      },
      {
        element: '#tour-welcome',
        popover: {
          title: '📊 Your Progress at a Glance',
          description:
            'This banner shows your overall completion percentage across all your college applications.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-progress',
        popover: {
          title: '📈 Applications, Essays & Recs',
          description:
            'These cards break down how many applications, essays, and recommendation letters you have completed vs. your total.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-deadlines',
        popover: {
          title: '⏰ Upcoming Deadlines',
          description:
            'All your application deadlines are tracked here automatically once you add an application. Never miss a due date!',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-essay-feedback',
        popover: {
          title: '📝 Essay Feedback',
          description:
            "When your counselor reviews your essays, their feedback shows up here. Check back after you submit a draft!",
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-upload-essay',
        popover: {
          title: '✍️ Submit an Essay',
          description:
            'Click here to upload an essay draft. Your counselor will review it and leave detailed feedback for you to act on.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '#tour-add-application',
        popover: {
          title: '🏫 Add an Application',
          description:
            "Track every school you're applying to — deadlines, application type, and status — all in one place.",
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '#tour-rec-letters',
        popover: {
          title: '📬 Recommendation Letters',
          description:
            "Request recommendation letters from your teachers and track whether they've been submitted to your schools.",
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '#tour-nav-my-work',
        popover: {
          title: '📁 My Work',
          description:
            'See all your submitted essays and detailed counselor feedback in one place. This is your essay hub.',
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '#tour-nav-rec',
        popover: {
          title: '🏅 Recommendation Letters',
          description:
            "Manage all your recommendation letter requests — see who's submitted, who's pending, and request new ones.",
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '#tour-nav-stats',
        popover: {
          title: '📊 My Stats',
          description:
            'A detailed view of your progress and statistics across your entire application journey.',
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '#tour-nav-messages',
        popover: {
          title: '💬 Messages',
          description:
            'Stay in touch with your counselor here. Ask questions, share updates, and get guidance anytime.',
          side: 'right',
          align: 'center',
        },
      },
    ],
    onDestroyed: () => {
      localStorage.setItem(TOUR_KEY, 'true');
    },
  });

  d.drive();
};

export const resetStudentTour = () => {
  localStorage.removeItem(TOUR_KEY);
};

export const StudentTour = () => {
  useEffect(() => {
    const isDone = localStorage.getItem(TOUR_KEY);
    if (!isDone) {
      const timer = setTimeout(startStudentTour, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
};